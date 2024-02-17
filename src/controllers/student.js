const { StatusCodes } = require("http-status-codes");
const { Op } = require("sequelize");
const {
  applySortingAndPagination,
  getSortingOrder,
} = require("../services/sortdata");

const { Student, Class, Term, Session, SchoolFee } = require("../../models");
const { updateStudentSchema } = require("../validations/studentValidation");

const { NotFoundError, BadRequestError } = require("../errors");

// Function to generate registration number
const generateRegistrationNumber = async () => {
  // IHN is a constant
  const constantPart = "IHN";

  // Get the current year
  const currentYear = new Date().getFullYear();

  // Find the count of students registered in the current year
  const count = await Student.count({
    where: {
      registration_number: {
        [Op.startsWith]: `${constantPart}/${currentYear}`,
      },
    },
  });

  // Increment the count for the current year to create a unique registration number
  const uniqueNumber = count + 1001;

  // Format the registration number
  const registrationNumber = `${constantPart}/${currentYear}/${uniqueNumber
    .toString()
    .padStart(4, "0")}`;

  return registrationNumber;
};

// Function to get school fee ID for school registration
// const getSchoolRegistrationFeeId = async () => {
//   // Assuming "school_registration" is a fee_type in the SchoolFee model
//   const schoolRegistrationFee = await SchoolFee.findOne({
//     where: {
//       fee_type: "school_registration",
//     },
//   });

//   if (!schoolRegistrationFee) {
//     throw new NotFoundError("School registration fee not found");
//   }

//   return schoolRegistrationFee.id;
// };

const createStudent = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      class_id,
      term_id,
      session_id,
      address,
      lga,
      next_of_kin_name,
      next_of_kin_phone_number,
      next_of_kin_address,
      next_of_kin_relation,
    } = req.body;

    // Check if a student with similar details already exists
    const existingStudent = await Student.findOne({
      where: {
        first_name: {
          [Op.iLike]: first_name, // Case-insensitive comparison
        },
        last_name: {
          [Op.iLike]: last_name, // Case-insensitive comparison
        },
        date_of_birth: {
          [Op.between]: [
            new Date(date_of_birth + "T00:00:00Z"),
            new Date(date_of_birth + "T23:59:59Z"),
          ], // Date of birth within the same day
        },
      },
    });

    if (existingStudent) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Student with similar details already exists",
      });
    }

    // Generate the registration number
    const registration_number = await generateRegistrationNumber();

    // Get the school registration fee ID
    // const schoolRegistrationFeeId = await getSchoolRegistrationFeeId();

    // Create the student with the generated registration number
    const newStudent = await Student.create({
      registration_number,
      first_name,
      last_name,
      date_of_birth,
      class_id,
      term_id,
      session_id,
      // school_fee_id: schoolRegistrationFeeId,
      address,
      lga,
      next_of_kin_name,
      next_of_kin_phone_number,
      next_of_kin_address,
      next_of_kin_relation,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Student created successfully",
      student: newStudent,
    });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const {
      status,
      sort,
      search,
      last_name,
      first_name,
      registration_number,
      class_id,
      session_id,
      term_id,
    } = req.query;

    const queryObject = {};

    if (status && status !== "all") {
      queryObject.status = status;
    }

    if (last_name) {
      queryObject.last_name = {
        [Op.iLike]: `%${last_name}%`,
      };
    }

    if (first_name) {
      queryObject.first_name = {
        [Op.iLike]: `%${first_name}%`,
      };
    }

    if (registration_number) {
      queryObject.registration_number = {
        [Op.iLike]: `%${registration_number}%`,
      };
    }

    if (class_id) {
      queryObject.class_id = class_id;
    }

    if (session_id) {
      queryObject.session_id = session_id;
    }

    if (term_id) {
      queryObject.term_id = term_id;
    }

    let students = await Student.findAll({
      where: queryObject,
      include: [
        { model: Session, attributes: ["id", "sessionName", "isActive"] },
        { model: Term, attributes: ["id", "term_name"] },
        { model: Class, attributes: ["id", "class_name"] },
      ],
      order: getSortingOrder(sort),
      offset: 0,
      limit: 10,
    });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Apply sorting, pagination, and additional filtering if needed
    students = applySortingAndPagination(students, sort, offset, limit);

    const totalStudents = await Student.count({ where: queryObject });
    const numOfPages = Math.ceil(totalStudents / limit);

    res.status(StatusCodes.OK).json({ students, totalStudents, numOfPages });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }
};

const getStudent = async (req, res) => {
  try {
    const {
      params: { registrationNumber },
    } = req;

    const singleStudent = await Student.findOne({
      where: { registration_number: registrationNumber },
      include: [
        { model: Class, attributes: ["id", "class_name"] },
        { model: Term, attributes: ["id", "term_name"] },
        { model: Session, attributes: ["id", "sessionName", "isActive"] },
        {
          model: SchoolFee,
          attributes: ["id", "session_id", "fee_type", "fee_amount"],
        },
        // { model: Transaction, attributes: ["id", "type", "amount"] },
      ],
    });

    if (!singleStudent) {
      throw new NotFoundError(
        `No student with registration number ${registrationNumber}`
      );
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Student retrieved successfully",
      student: singleStudent,
    });
  } catch (error) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const {
      params: { registrationNumber },
      body: updatedData,
    } = req;

    // Validate the updated data
    const validationResult = await updateStudentSchema.validate(updatedData, {
      abortEarly: false,
    });

    if (validationResult.error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        errors: validationResult.error.details.map((error) => error.message),
      });
    }

    // Attempt to update the student
    try {
      const updatedStudent = await findAndUpdateStudent(
        registrationNumber,
        updatedData
      );

      if (updatedStudent) {
        // Successful update
        return res.status(StatusCodes.OK).json({
          success: true,
          message: "Student updated successfully",
          student: updatedStudent,
        });
      } else {
        // Handle the case where the update function returns falsy for successful updates
        throw new Error("Failed to update student");
      }
    } catch (error) {
      // Handle specific errors
      if (error instanceof NotFoundError) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: `No student with registration number ${registrationNumber}`,
        });
      } else {
        // Handle other errors during the update
        throw error;
      }
    }
  } catch (error) {
    // Handle validation errors or other unexpected errors
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: error.message,
    });
  }
};

const findAndUpdateStudent = async (registrationNumber, updatedData) => {
  try {
    const studentToUpdate = await Student.findOne({
      where: { registration_number: registrationNumber },
      returning: true,
    });

    if (!studentToUpdate) {
      throw new NotFoundError(registrationNumber);
    }

    // Log the current values before update
    console.log("Before Update:", studentToUpdate.toJSON());

    // Update only the specified fields
    Object.keys(updatedData).forEach((field) => {
      if (studentToUpdate[field] !== undefined) {
        studentToUpdate[field] = updatedData[field];
      }
    });

    // Save the updated student
    await studentToUpdate.save();

    // Retrieve the updated student
    const updatedStudent = await Student.findOne({
      where: { registration_number: registrationNumber },
      include: [
        { model: Class, attributes: ["id", "class_name"] },
        { model: Term, attributes: ["id", "term_name"] },
        { model: Session, attributes: ["id", "sessionName", "isActive"] },

        // { model: Transaction, attributes: ["id", "type", "amount"] },
      ],
    });

    return updatedStudent;
  } catch (error) {
    throw error;
  }
};

const deleteStudent = async (req, res) => {
  try {
    const {
      params: { registrationNumber },
    } = req;

    // Find the student by registration number
    const studentToDelete = await Student.findOne({
      where: { registration_number: registrationNumber },
    });

    // Check if the student exists
    if (!studentToDelete) {
      throw new NotFoundError(
        `No student with registration number ${registrationNumber}`
      );
    }

    // Delete the student
    await studentToDelete.destroy();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    // Handle specific errors
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: error.message,
      });
    }

    // Handle other errors
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
};
