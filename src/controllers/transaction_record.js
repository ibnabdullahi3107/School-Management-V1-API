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
  Transaction,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");

const { BadRequestError, NotFoundError } = require("../errors");

const getTransactionRecords = async (req, res) => {
  const {
    session_id,
    payment_type_id,
    term_id,
    transaction_type,
    transaction_status,
    start_date,
    end_date,
    page,
    limit,
  } = req.query;

  // Default values for page and limit
  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const offset = (pageNumber - 1) * pageSize;

  // Validate parameters
  if (
    !session_id &&
    !term_id &&
    !payment_type_id &&
    !transaction_type &&
    !transaction_status &&
    (!start_date || !end_date)
  ) {
    throw new BadRequestError(
      "At least one of session_id, term_id, payment_type_id, transaction_type, transaction_status, or start_date, end_date is required."
    );
  }

  const query = {
    where: {},
    include: [
      {
        model: Receipt,
        include: [
          {
            model: Payment,
          },
          {
            model: Discount,
          },
          {
            model: OutstandingBalance,
          },
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
        ],
      },
    ],
    order: [["createdAt", "ASC"]], // Example default sorting
    offset: offset,
    limit: pageSize,
  };

  if (session_id)
    query.include[0].include[4].where = { session_id: session_id };
  if (term_id) query.include[0].include[4].where = { term_id: term_id };

  if (payment_type_id) query.where.payment_type_id = payment_type_id;
  if (transaction_type) query.where.transaction_type = transaction_type;
  if (transaction_status) query.where.transaction_status = transaction_status;

  if (start_date && end_date) {
    // Parse start_date and end_date using moment.js
    const parsedStartDate = moment(start_date, "YYYY-MM-DD", true);
    const parsedEndDate = moment(end_date, "YYYY-MM-DD", true);

    // Validate parsed dates
    if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
      throw new BadRequestError("Invalid date format. Use YYYY-MM-DD.");
    }

    // Ensure that the where object is initialized
    if (!query.include[0].where) {
      query.include[0].where = {};
    }

    // Set startDate and endDate for searching transactions within the provided range
    const startDate = parsedStartDate.startOf("day").toDate();
    const endDate = parsedEndDate.endOf("day").toDate();

    // Update query to search transactions between the provided dates
    query.include[0].where.createdAt = {
      [Op.between]: [startDate, endDate],
    };
  }

  const transactions = await Transaction.findAndCountAll(query);

  const totalPages = Math.ceil(transactions.count / pageSize);

  // Format response
  const formattedTransactions = transactions.rows.map((transaction) => ({
    receipt_number: transaction.Receipt.receipt_number,
    transaction_type: transaction.transaction_type,
    transaction_status: transaction.transaction_status,
    payment_method: transaction.payment_method,
    student: {
      id: transaction.Receipt.Student.id,
      reg_number: transaction.Receipt.Student.reg_number,
      firstName: transaction.Receipt.Student.first_name,
      lastName: transaction.Receipt.Student.last_name,
      gender: transaction.Receipt.Student.gender,
      // Add other student details as needed
    },
    payment: {
      id: transaction.Receipt.Payment.id,
      //   amount: transaction.Receipt.Payment.amount,
      payment_status: transaction.Receipt.Payment.regular_payment
        ? "Not Outstanding"
        : "Outstanding",
      //   payment_method: transaction.Receipt.Payment.amount_type,
      paymentDate: transaction.Receipt.Payment.payment_date,
      term: {
        id: transaction.Receipt.Enrollment.Term.id,
        name: transaction.Receipt.Enrollment.Term.term_name,
        session: {
          id: transaction.Receipt.Enrollment.Term.Session.id,
          name: transaction.Receipt.Enrollment.Term.Session.session_name,
          // Add other session details as needed
        },
      },
      // Add other payment details as needed
    },
    discount_id: transaction.Receipt.discount_id,
    outstanding_id: transaction.Receipt.outstanding_id,
    class: {
      id: transaction.Receipt.Enrollment.Class.id,
      name: transaction.Receipt.Enrollment.Class.class_name,
      // Add other class details as needed
    },
    createdAt: transaction.createdAt,
    // Add other receipt details as needed
  }));

  res.status(StatusCodes.OK).json({
    data: formattedTransactions,
    pagination: {
      total: transactions.count,
      pages: totalPages,
      currentPage: pageNumber,
      pageSize: pageSize,
    },
  });
};

module.exports = {
  getTransactionRecords,
};
