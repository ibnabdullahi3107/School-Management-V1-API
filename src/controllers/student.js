const { StatusCodes } = require("http-status-codes");
const { Op } = require("sequelize");
const moment = require("moment");

const {
  applySortingAndPagination,
  getSortingOrder,
} = require("../services/sortdata");

const { generateReceiptNumber } = require("../services/generateReceiptNumber");
const { getReceiptData } = require("../services/getReceiptData");
const { generateRegistrationNumber } = require("../services/generateRegistrationNumber");

const {
  Student,
  Enrollment,
  Class,
  Term,
  Session,
  Payment,
  PaymentType,
  OutstandingBalance,
  Discount,
  Receipt,
} = require("../../models");
const { updateStudentSchema } = require("../validations/studentValidation");

const { NotFoundError, BadRequestError } = require("../errors");


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
    discount_amount,
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

  // if (!discount_amount) {
  //   throw new BadRequestError(
  //     "Discount amount is required and should be positive"
  //   );
  // }

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

  let registrationPayment, studentDiscount, studentOutstanding, remainingAmount;

  if (amount) {
    // Check if the provided amount is enough to cover the registration fee
    if (amount >= registrationPaymentType.amount) {
      // Deduct the registration fee from the provided amount
      remainingAmount = amount - registrationPaymentType.amount;

      // Pay the school registration
      registrationPayment = await Payment.create({
        student_id: newStudent.id,
        payment_type_id: registrationPaymentType.payment_type_id,
        amount: registrationPaymentType.amount,
        amount_type,
        session_id,
        term_id,
      });

      const remainingAmountWithDiscount = remainingAmount + discount_amount;

      // Check if there's enough remaining amount to cover the school fees
      if (remainingAmountWithDiscount >= schoolFeesPaymentType.amount) {
        // Pay the school fees
        schoolFeesPayment = await Payment.create({
          student_id: newStudent.id,
          payment_type_id: schoolFeesPaymentType.payment_type_id,
          amount: remainingAmount,
          amount_type,
          session_id,
          term_id,
        });

        if (!discount_amount <= 0) {
          // Create the discount
          studentDiscount = await Discount.create({
            student_id: newStudent.id,
            session_id,
            term_id,
            payment_type_id: schoolFeesPaymentType.payment_type_id,
            discount_amount,
          });

        }

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

         if (!discount_amount <= 0) {
           // Create the discount
           studentDiscount = await Discount.create({
             student_id: newStudent.id,
             session_id,
             term_id,
             payment_type_id: schoolFeesPaymentType.payment_type_id,
             discount_amount,
           });

         }

        // Record the remaining amount as an outstanding balance for the school fees
        const outstandingAmount =
          schoolFeesPaymentType.amount - remainingAmountWithDiscount;
        studentOutstanding = await OutstandingBalance.create({
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
      "Please provide the amount for both Registration and School fees"
    );
  }

  // Generate receipt numbers for registration and school fees payments
  const registrationReceiptNumber = await generateReceiptNumber();

  // Create receipts for registration and school fees payments
  const registrationReceipt = await Receipt.create({
    receipt_number: registrationReceiptNumber,
    student_id: newStudent.id,
    payment_id: registrationPayment.id,
    discount_id: studentDiscount ? studentDiscount.discount_id : null,
    outstanding_id: null,
    class_id: newEnrollmentStudent.id,
    amount_paid: registrationPaymentType.amount,
  });

  const registrationReceiptData = await getReceiptData(registrationReceipt);

  const schoolFeesReceiptNumber = await generateReceiptNumber();

  const schoolFeesReceipt = await Receipt.create({
    receipt_number: schoolFeesReceiptNumber,
    student_id: newStudent.id,
    payment_id: schoolFeesPayment.id,
    discount_id: studentDiscount ? studentDiscount.discount_id : null,
    outstanding_id: studentOutstanding ? studentOutstanding.id : null,
    class_id: newEnrollmentStudent.id,
    amount_paid: remainingAmount,
  });

  // Fetch additional information related to the registration receipt
  const schoolFeesReceiptData = await getReceiptData(schoolFeesReceipt);

  // Prepare the response object
  const response = {
    success: true,
    message: "Student created and enrolled successfully",
    registrationReceiptData,
    schoolFeesReceiptData,
  };

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
