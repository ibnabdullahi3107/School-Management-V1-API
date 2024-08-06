const { StatusCodes } = require("http-status-codes");
const moment = require("moment");

const {
  Payment,
  Student,
  Session,
  Term,
  PaymentType,
  Enrollment,
  Receipt,
  Class,
  Discount,
  OutstandingBalance,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");

const { BadRequestError, NotFoundError } = require("../errors");

const getStudentsWithReceipts = async (req, res) => {
  const {
    session_id,
    payment_type_id,
    term_id,
    class_id,
    start_date,
    end_date,
  } = req.query;
  let { page, limit } = req.query;

  // Default values for page and limit
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const offset = (page - 1) * limit;

  // Validate at least one required query parameter is provided
  if (!session_id && !term_id && !payment_type_id && !class_id) {
    throw new BadRequestError(
      "At least one of session_id, term_id, or payment_type_id is required."
    );
  }

  // Build query based on provided parameters
  const query = {
    where: {},
    include: [
      {
        model: Student,
      },
      {
        model: Payment,
        where: {},
        include: [
          {
            model: Term,
            include: [
              {
                model: Session,
              },
            ],
          },
          {
            model: PaymentType,
          },
        ],
      },
      {
        model: Enrollment,
        where: {},
        include: [Class, Term],
      },
    ],
    order: [["createdAt", "ASC"]], // Example default sorting
    offset: offset,
    limit: limit,
  };

  if (session_id) query.include[1].where.session_id = session_id;
  if (term_id) query.include[1].where.term_id = term_id;
  if (payment_type_id) query.include[1].where.payment_type_id = payment_type_id;
  if (class_id) query.include[2].where.class_id = class_id;
  if (start_date && end_date) {
    // Add filtering based on payment date range if start_date and end_date are provided
    query.include[1].where.payment_date = {
      [Op.between]: [start_date, end_date],
    };
  }

  const receipts = await Receipt.findAndCountAll(query);

  const totalPages = Math.ceil(receipts.count / limit);

  // Format response
  const formattedReceipts = receipts.rows.map((receipt) => ({
    receipt_number: receipt.receipt_number,
    student: {
      id: receipt.Student.id,
      reg_numeber: receipt.Student.reg_number,
      firstName: receipt.Student.first_name,
      lastName: receipt.Student.last_name,
      gender: receipt.Student.gender,
      // Add other student details as needed
    },
    payment: {
      id: receipt.Payment.id,
      amount: receipt.Payment.amount,
      payment_status: receipt.Payment.regular_payment
        ? "Not Outstanding"
        : "Outsatnding",
      payment_method: receipt.Payment.amount_type,
      paymentDate: receipt.Payment.payment_date,
      term: {
        id: receipt.Payment.Term.id,
        name: receipt.Payment.Term.term_name,
        session: {
          id: receipt.Payment.Term.Session.id,
          name: receipt.Payment.Term.Session.session_name,
          // Add other session details as needed
        },
      },
      // Add other payment details as needed
    },
    discount_id: receipt.discount_id,
    outstanding_id: receipt.outstanding_id,
    class: {
      id: receipt.Enrollment.Class.id,
      name: receipt.Enrollment.Class.class_name,
      // Add other class details as needed
    },
    createdAt: receipt.createdAt,
    // Add other receipt details as needed
  }));

  res.status(StatusCodes.OK).json({
    data: formattedReceipts,
    pagination: {
      total: receipts.count,
      pages: totalPages,
      currentPage: page,
      pageSize: limit,
    },
  });
};

const getByReceiptNumber = async (req, res) => {
  const { receipt_number } = req.params;

  // Validate receipt_number parameter
  if (!receipt_number) {
    throw new BadRequestError("receipt_number parameter is required.");
  }

  // Query receipt based on receipt number
  const receipt = await Receipt.findOne({
    where: { receipt_number: receipt_number },
    include: [
      {
        model: Student,
      },
      {
        model: Enrollment,
        include: [
          {
            model: Term,
            include: [
              {
                model: Session,
              },
            ],
          },
          {
            model: Class,
          },
        ],
      },
      {
        model: Payment,
      },
      {
        model: Discount,
      },
      {
        model: OutstandingBalance,
      },
    ],
  });

  // Validate receipt_number parameter
  if (!receipt) {
    throw new NotFoundError(
      `Receipt not found for receipt number ${receipt_number}.`
    );
  }

  // Format response
  const session = receipt.Enrollment.Term.Session;
  const formattedSession = {
    student: {
      id: receipt.Student.id,
      reg_numeber: receipt.Student.reg_number,
      firstName: receipt.Student.first_name,
      lastName: receipt.Student.last_name,
      gender: receipt.Student.gender,
      // Add other student details as needed
    },
    session: {
      id: session.id,
      name: session.session_name,
    },
    term: {
      id: receipt.Enrollment.Term.id,
      name: receipt.Enrollment.Term.term_name,
    },
    receipt: {
      receipt_number: receipt.receipt_number,
      createdAt: receipt.createdAt,
      // Add other receipt details as needed
    },
    enrollment: {
      class: {
        id: receipt.Enrollment.Class.id,
        name: receipt.Enrollment.Class.class_name,
        // Add other class details as needed
      },
    },
    payment: receipt.Payment
      ? {
          id: receipt.Payment.id,
          amount: receipt.Payment.amount,
          payment_status: receipt.Payment.regular_payment
            ? "Not Outstanding"
            : "Outstanding",
          payment_method: receipt.Payment.amount_type,
          paymentDate: receipt.Payment.payment_date,
        }
      : null,
    discount: receipt.Discount
      ? {
          id: receipt.Discount.id,
          // Add other discount details as needed
        }
      : null,
    outstandingBalance: receipt.OutstandingBalance
      ? {
          id: receipt.OutstandingBalance.id,
          // Add other outstanding balance details as needed
        }
      : null,
  };

  res.status(StatusCodes.OK).json(formattedSession);
};

module.exports = {
  getStudentsWithReceipts,
  getByReceiptNumber,
};
