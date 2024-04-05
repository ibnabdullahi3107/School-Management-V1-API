const { StatusCodes } = require("http-status-codes");
// const moment = require("moment");
const {
  Payment,
  Student,
  Class,
  Session,
  Term,
  Enrollment,
  PaymentType,
  OutstandingBalance,
  Receipt,
} = require("../../models");
const { Op } = require("sequelize");

const {
  applySortingAndPagination,
  getSortingOrder,
} = require("../services/sortdata");

const {
  handleOutstandingBalances,
} = require("../services/handleOutstandingBalances");
const {
  determineSessionAndTerm,
} = require("../services/determineSessionAndTerm");
const { getReceiptData } = require("../services/getReceiptData");
const { generateReceiptNumber } = require("../services/generateReceiptNumber");

const { BadRequestError, NotFoundError } = require("../errors");

const create_Process_Payment = async (req, res) => {
  const { student_id, payment_type_id, amount, amount_type } = req.body;

  // Check if the student exists
  const student = await Student.findByPk(student_id);
  if (!student) {
    throw new NotFoundError(`No student found with ID number ${student_id}.`);
  }

  // Check if payment type exists
  const paymentType = await PaymentType.findByPk(payment_type_id);
  if (!paymentType) {
    throw new NotFoundError(
      `Payment type with id ${payment_type_id} not found.`
    );
  }

  // Query the Payment table to retrieve the last payment made by the student
  const lastPayment = await Payment.findOne({
    where: { student_id },
    order: [["payment_date", "DESC"]],
  });

  // If there's no last payment, return an error
  if (!lastPayment) {
    throw new BadRequestError(
      "No previous payments available to determine session and term."
    );
  }

  // Determine session_id and term_id
  const { session_id, term_id } = await determineSessionAndTerm(
    student_id,
    lastPayment
  );

  // Handle outstanding balances and get the remaining amount
  let remainingAmount = amount;
  if (lastPayment && lastPayment.payment_type_id === payment_type_id) {
    remainingAmount = await handleOutstandingBalances(
      student_id,
      payment_type_id,
      amount,
      lastPayment.session_id,
      lastPayment.term_id,
      amount_type
    );
  }

  const paymentTypeAmount = paymentType.amount;

  let paymentReceipt;

  // fetch receipt in the payment receipt 

  const enrollmentStudent = await Enrollment.findByPk(student_id);

  // Generate receipt numbers for payment
  const receiptNumber = await generateReceiptNumber();

  // If there's a remaining amount after deducting outstanding balances
  if (remainingAmount > 0) {
    let payment;
    // Check if the remaining amount is sufficient to pay for another term
    if (remainingAmount >= paymentTypeAmount) {
      // Pay for the current term
      payment = await Payment.create({
        student_id,
        payment_type_id,
        amount: paymentTypeAmount,
        amount_type,
        session_id,
        term_id,
        regular_payment: true, // Indicate deduction in status Regular Payment as true
      });

      // Create receipts for payments
      paymentReceipt = await Receipt.create({
        receipt_number: receiptNumber,
        student_id,
        payment_id: payment.id,
        discount_id: null,
        outstanding_id: null,
        class_id: enrollmentStudent.id,
        amount_paid: paymentTypeAmount,
      });
    } else {
      // Pay for the remaining amount in another term and move the rest to outstanding
      const remainingTermAmount = paymentTypeAmount - remainingAmount;
      payment = await Payment.create({
        student_id,
        payment_type_id,
        amount: remainingAmount,
        amount_type,
        session_id,
        term_id,
        regular_payment: true, // Indicate deduction in status Regular Payment as true
      });
      // Move the rest amount to outstanding balances
      const studentOutstanding = await OutstandingBalance.create({
        student_id,
        payment_type_id,
        amount: remainingTermAmount,
        session_id,
        term_id,
      });

      // Create receipts for payments
      paymentReceipt = await Receipt.create({
        receipt_number: receiptNumber,
        student_id,
        payment_id: payment.id,
        discount_id: null,
        outstanding_id: studentOutstanding ? studentOutstanding.id : null,
        class_id: enrollmentStudent.id,
        amount_paid: remainingAmount,
      });
    }
  }

  // Fetch additional information related to receipt
  const receiptData = await getReceiptData(paymentReceipt);

  const response = {
    success: true,
    message: "Payment created successfully",
    receiptData,
  };

  res.status(StatusCodes.CREATED).json(response);
};

const getAll_Process_Payment = async (req, res) => {
  const {
    term_id,
    session_id,
    payment_type_id,
    amount_type,
    reg_number,
    last_name,
    search,
  } = req.query;

  // Construct the filter object based on the provided query parameters
  const filter = {};
  if (term_id) filter.term_id = term_id;
  if (session_id) filter.session_id = session_id;
  if (payment_type_id) filter.payment_type_id = payment_type_id;
  if (amount_type) filter.amount_type = amount_type;

  // Include filtering based on student attributes
  const studentFilter = {};
  if (reg_number) studentFilter.reg_number = reg_number;
  if (last_name) studentFilter.last_name = last_name;

  // Include text search
  const searchTextFilter = {};
  if (search) {
    searchTextFilter[Op.or] = [
      { "$Student.reg_number$": { [Op.like]: `%${search}%` } },
      { "$Student.first_name$": { [Op.like]: `%${search}%` } },
      { "$Student.last_name$": { [Op.like]: `%${search}%` } },
      // Add other columns you want to include in the search
    ];
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  // Find payments based on the filter object
  const { count, rows } = await Payment.findAndCountAll({
    where: filter,
    include: [
      {
        model: Student,
        attributes: [
          "id",
          "reg_number",
          "first_name",
          "last_name",
          "date_of_birth",
          "gender",
          "address",
          "local_government_area",
          "next_of_kin_name",
          "next_of_kin_phone_number",
          "next_of_kin_address",
          "next_of_kin_relation",
        ],
        where: { ...studentFilter, ...searchTextFilter }, // Apply student filtering and text search
      },
      {
        model: PaymentType,
        attributes: ["payment_type_id", "payment_type_name"],
      },
      { model: Session, attributes: ["session_id", "session_name"] },
      { model: Term, attributes: ["term_id", "term_name"] },
    ],
    offset,
    limit,
  });

  if (!rows || rows.length === 0) {
    throw new NotFoundError("No payments found.");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Payments retrieved successfully",
    payments: rows,
    pagination: {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  });
};

const get_Process_Payment = async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findByPk(id, {
    include: [
      {
        model: Student,
        attributes: [
          "id",
          "reg_number",
          "first_name",
          "last_name",
          "date_of_birth",
          "gender",
          "address",
          "local_government_area",
          "next_of_kin_name",
          "next_of_kin_phone_number",
          "next_of_kin_address",
          "next_of_kin_relation",
        ],
      },
      {
        model: PaymentType,
        attributes: ["payment_type_id", "payment_type_name"],
      },
      { model: Session, attributes: ["session_id", "session_name"] },
      { model: Term, attributes: ["term_id", "term_name"] },
    ],
  });

  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Payment not found",
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Payment retrieved successfully",
    payment: payment,
  });
};

const update_Process_Payment = async (req, res) => {
  const {
    params: { id },
    body: updateFields,
  } = req;

  // Check if the payment exists
  let payment = await Payment.findByPk(id);
  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Payment not found",
    });
  }

  // Update the payment details
  for (const key in updateFields) {
    if (Object.hasOwnProperty.call(updateFields, key)) {
      payment[key] = updateFields[key];
    }
  }

  // Save the updated payment
  await payment.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Payment updated successfully",
    payment: payment,
  });
};

const delete_Process_Payment = async (req, res) => {
  const { id } = req.params;

  // Check if the payment exists
  const payment = await Payment.findByPk(id);
  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Payment not found",
    });
  }

  // Delete the payment
  await payment.destroy();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Payment deleted successfully",
  });
};

module.exports = {
  create_Process_Payment,
  getAll_Process_Payment,
  get_Process_Payment,
  update_Process_Payment,
  delete_Process_Payment,
};
