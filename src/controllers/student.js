const { StatusCodes } = require("http-status-codes");
const { Op } = require("sequelize");
const moment = require("moment");

const {
  applySortingAndPagination,
  getSortingOrder,
} = require("../services/sortdata");

const {
  Student,
  Enrollment,
  Class,
  Term,
  Session,
  Payment,
  PaymentType,
  OutstandingBalance,
} = require("../../models");
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
      reg_number: {
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

const createStudent = async (req, res) => {
  const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    address,
    session_id,
    term_id,
    class_id,
    amount,
    amount_type,
    local_government_area,
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
    throw new BadRequestError("Student with similar details already exists");
  }

  // Check if the session exists
  const session = await Session.findByPk(session_id);
  if (!session) {
    throw new NotFoundError(`No Session with id ${session_id}`);
  }

  // Check if the term exists and belongs to the specified session
  const term = await Term.findOne({
    where: {
      term_id,
      session_id: session_id,
    },
  });

  if (!term) {
    throw new NotFoundError(
      `No term with id ${term_id} in session ${session_id}`
    );
  }

  // Check if the class exists
  const classObj = await Class.findByPk(class_id);
  if (!classObj) {
    throw new NotFoundError(`Class with id ${class_id} not found`);
  }

  // Create payment for school registration
  const registrationPaymentType = await PaymentType.findOne({
    where: { payment_type_name: "School Registration" },
  });
  if (!registrationPaymentType) {
    throw new NotFoundError('Payment type "School Registration" not found');
  }

  // Create payment for school fees
  const schoolFeesPaymentType = await PaymentType.findOne({
    where: { payment_type_name: "School Fees" },
  });
  if (!schoolFeesPaymentType) {
    throw new NotFoundError('Payment type "School Fees" not found');
  }

  // Generate the registration number
  const reg_number = await generateRegistrationNumber();

  // Create the student with the generated registration number
  const newStudent = await Student.create({
    reg_number,
    first_name,
    last_name,
    date_of_birth,
    gender,
    address,
    local_government_area,
    next_of_kin_name,
    next_of_kin_phone_number,
    next_of_kin_address,
    next_of_kin_relation,
  });

  // Enroll the student in the specified class and term
  const newEnrollmentStudent = await Enrollment.create({
    student_id: newStudent.id,
    session_id,
    term_id,
    class_id,
  });

  let registrationPayment;

  if (amount) {
    // Check if the provided amount is enough to cover the registration fee
    if (amount >= registrationPaymentType.amount) {
      // Deduct the registration fee from the provided amount
      const remainingAmount = amount - registrationPaymentType.amount;

      // Pay the school registration
      registrationPayment = await Payment.create({
        student_id: newStudent.id,
        payment_type_id: registrationPaymentType.payment_type_id,
        amount: registrationPaymentType.amount,
        amount_type,
        session_id,
        term_id,
      });

      // Check if there's enough remaining amount to cover the school fees
      if (remainingAmount >= schoolFeesPaymentType.amount) {
        // Pay the school fees
        schoolFeesPayment = await Payment.create({
          student_id: newStudent.id,
          payment_type_id: schoolFeesPaymentType.payment_type_id,
          amount: schoolFeesPaymentType.amount,
          amount_type,
          session_id,
          term_id,
        });
      } else {
        // Add the outstanding balance for the remaining amount in school fees
        schoolFeesPayment = await Payment.create({
          student_id: newStudent.id,
          payment_type_id: schoolFeesPaymentType.payment_type_id,
          amount: remainingAmount,
          amount_type,
          session_id,
          term_id,
        });

        // Record the remaining amount as an outstanding balance for the school fees
        const outstandingAmount =
          schoolFeesPaymentType.amount - remainingAmount;
        await OutstandingBalance.create({
          student_id: newStudent.id,
          term_id,
          session_id,
          payment_type_id: schoolFeesPaymentType.payment_type_id,
          amount: outstandingAmount,
        });
      }
    } else {
      throw new BadRequestError(
        "Insufficient amount to cover the registration fee"
      );
    }
  } else {
    throw new NotFoundError(
      "Please provide the amount for both Reg. & School fees"
    );
  }


  // Fetch outstanding balances if they exist
  const outstandingBalances = await OutstandingBalance.findAll({
    where: {
      student_id: newStudent.id,
    },
  });

  // Prepare the response object
  const response = {
    success: true,
    message: "Student created and enrolled successfully",
    student: newStudent,
    Enrollment: newEnrollmentStudent,
    registrationPayment, 
    schoolFeesPayment, 
  };

  // Include outstanding balances in the response if they exist
  if (outstandingBalances.length > 0) {
    response.outstandingBalances = outstandingBalances;
  }

  res.status(StatusCodes.CREATED).json(response);
};


const getAllStudents = async (req, res) => {
  try {
    const { status, sort, search, last_name, first_name, reg_number } =
      req.query;

    const queryObject = {};
    if (status && status !== "all") queryObject.status = status;
    if (last_name) queryObject.last_name = { [Op.iLike]: `%${last_name}%` };
    if (first_name) queryObject.first_name = { [Op.iLike]: `%${first_name}%` };
    if (reg_number) queryObject.reg_number = { [Op.iLike]: `%${reg_number}%` };

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Student.findAndCountAll({
      where: queryObject,
      order: getSortingOrder(sort),
      offset,
      limit,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: error.message });
  }
};

const getStudent = async (req, res) => {
  const { reg_number } = req.params;
  const student = await Student.findOne({ where: { reg_number } });

  if (!student) {
    throw new NotFoundError(
      `No student found with registration number ${reg_number}.`
    );
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Student retrieved successfully.",
    student,
  });
};

const updateStudent = async (req, res) => {
  const {
    params: { reg_number },
    body: updatedData,
  } = req;

  // Validate the updated data
  await updateStudentSchema.validate(updatedData, {
    abortEarly: false,
  });

  // Attempt to update the student
  const updatedStudent = await findAndUpdateStudent(reg_number, updatedData);

  if (!updatedStudent) {
    throw new NotFoundError(`No student found with reg number ${reg_number}`);
  }

  // Successful update
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Student updated successfully",
    student: updatedStudent,
  });
};

const findAndUpdateStudent = async (reg_number, updatedData) => {
  const studentToUpdate = await Student.findOne({
    where: { reg_number: reg_number },
    returning: true,
  });

  if (!studentToUpdate) {
    throw new NotFoundError(
      `No student found with registration number ${reg_number}`
    );
  }

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
    where: { reg_number: reg_number },
  });

  return updatedStudent;
};

const deleteStudent = async (req, res) => {
  const {
    params: { reg_number },
  } = req;

  // Find the student by registration number
  const studentToDelete = await Student.findOne({
    where: { reg_number: reg_number },
  });

  // Check if the student exists
  if (!studentToDelete) {
    throw new NotFoundError(
      `No student with registration number ${reg_number}`
    );
  }

  // Delete the student
  await studentToDelete.destroy();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Student deleted successfully",
  });
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
};
