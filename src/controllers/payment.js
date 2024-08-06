const { StatusCodes } = require("http-status-codes");
// const moment = require("moment");
const {
  Payment,
  Student,
  Transaction,
  Session,
  Term,
  Enrollment,
  PaymentType,
  OutstandingBalance,
  Receipt,
  sequelize,
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
const { updateAccountBalance } = require("../services/updateAccountBalance");

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

  // Retrieve the student's enrollment record
  const enrollmentStudent = await Enrollment.findOne({
    where: { student_id },
  });

  if (!enrollmentStudent) {
    throw new NotFoundError(
      `Enrollment for student with id ${student_id} not found.`
    );
  }
  // Query the Payment table to retrieve the last payment made by the student
  const lastPayment = await Payment.findOne({
    where: { student_id, payment_type_id },
    order: [["payment_date", "DESC"]],
  });

  let session_id, term_id;

  if (!lastPayment) {
    // If there are no previous payments, determine session and term based on enrollment
    const studentEnrollment = await Enrollment.findOne({
      where: { student_id },
      order: [["createdAt", "ASC"]],
    });

    session_id = studentEnrollment.session_id;
    term_id = studentEnrollment.term_id;

  } else {
    // Determine session_id and term_id based on the last payment
    ({ session_id, term_id } = await determineSessionAndTerm(
      student_id,
      lastPayment
    ));
  }


  // Retrieve session and term information
  const session = await Session.findByPk(session_id);
  const term = await Term.findByPk(term_id);

  // Fetch additional payment type information
  const paymentTypeAmount = paymentType.amount;

  // Initialize remainingAmount before the if block
  let remainingAmount = amount;

  // Handle outstanding balances and get the deducted amount and remaining amount
  const { deductedAmount, remainingAmount: remaining } =
    await handleOutstandingBalances(student_id, payment_type_id, amount);

  remainingAmount = remaining; // Update remainingAmount with the value from handleOutstandingBalances

  let payment;
  let paymentReceipts = [];

  // Create payment for the deducted amount if any
  if (deductedAmount > 0) {
    payment = await Payment.create({
      student_id,
      payment_type_id,
      amount: deductedAmount,
      session_id: lastPayment ? lastPayment.session_id : "null",
      term_id: lastPayment ? lastPayment.term_id : "null",
      amount_type,
      regular_payment: false,
    });
    // Create receipts for payments
    const paymentReceipt = await Receipt.create({
      receipt_number: await generateReceiptNumber(),
      student_id,
      payment_id: payment ? payment.id : "null",
      discount_id: null,
      outstanding_id: null,
      class_id: enrollmentStudent ? enrollmentStudent.id : "null",
      amount_paid: deductedAmount,
    });

    await Transaction.create({
      amount: paymentReceipt.amount_paid,
      description: `Outstanding Payment for Session: ${session.session_name}, Term: ${term.term_name}`,
      transaction_type: "Income",
      transaction_status: "Completed",
      payment_method: payment.amount_type,
      receipt_id: paymentReceipt.id,
      payment_type_id,
      related_entity_id: student_id,
    });

    await updateAccountBalance(payment_type_id, paymentReceipt.amount_paid);

    paymentReceipts.push(paymentReceipt);
  }

  // If there's a remaining amount after deducting outstanding balances
  if (remainingAmount !== 0) {
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

      const paymentReceipt = await Receipt.create({
        receipt_number: await generateReceiptNumber(),
        student_id,
        payment_id: payment.id,
        discount_id: null,
        outstanding_id: null,
        class_id: enrollmentStudent ? enrollmentStudent.id : null,
        amount_paid: paymentTypeAmount,
      });

      await Transaction.create({
        amount: paymentReceipt.amount_paid,
        description: paymentType.payment_type_name,
        transaction_type: "Income",
        transaction_status: "Completed",
        payment_method: payment.amount_type,
        receipt_id: paymentReceipt.id,
        payment_type_id,
        related_entity_id: student_id,
      });

      await updateAccountBalance(payment_type_id, paymentReceipt.amount_paid);

      paymentReceipts.push(paymentReceipt);
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
      const paymentReceipt = await Receipt.create({
        receipt_number: await generateReceiptNumber(),
        student_id,
        payment_id: payment.id,
        discount_id: null,
        outstanding_id: studentOutstanding ? studentOutstanding.id : null,
        class_id: enrollmentStudent ? enrollmentStudent.id : null,
        amount_paid: remainingAmount,
      });
      await Transaction.create({
        amount: paymentReceipt.amount_paid,
        description: paymentType.payment_type_name,
        transaction_type: "Income",
        transaction_status: "Completed",
        payment_method: payment.amount_type,
        receipt_id: paymentReceipt.id,
        payment_type_id,
        related_entity_id: student_id,
      });

      await updateAccountBalance(payment_type_id, paymentReceipt.amount_paid);
      paymentReceipts.push(paymentReceipt);
    }
  }

  // Fetch receipt data for each payment receipt
  const receiptData = [];
  for (const receipt of paymentReceipts) {
    const data = await getReceiptData(receipt);
    receiptData.push(data);
  }

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

const getStudentsWithPayments = async (req, res) => {
  const { session_id, term_id } = req.query;

 // Construct the where condition based on the provided session_id and term_id
    const whereCondition = {};
    if (session_id && term_id) {
      whereCondition[Op.or] = [{ session_id }, { term_id }];
    } else if (session_id) {
      whereCondition.session_id = session_id;
    } else if (term_id) {
      whereCondition.term_id = term_id;
    }

    // Retrieve students with payments based on the constructed where condition
    const studentsWithPayments = await Student.findAll({
      include: [
        {
          model: Payment,
          where: whereCondition,
          required: true, // Ensures that only students with payments are included
        },
      ],
    });

    // Send the response with studentsWithPayments
      res.status(StatusCodes.CREATED).json(studentsWithPayments);

};

module.exports = {
  create_Process_Payment,
  getAll_Process_Payment,
  get_Process_Payment,
  update_Process_Payment,
  delete_Process_Payment,
  getStudentsWithPayments,
};
