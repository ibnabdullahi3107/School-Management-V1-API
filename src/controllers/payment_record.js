const { StatusCodes } = require("http-status-codes");
const moment = require("moment");

const {
  Payment,
  Student,
  Session,
  Term,
  PaymentType,
  sequelize,
} = require("../../models");
const { Op } = require("sequelize");

const { BadRequestError, NotFoundError } = require("../errors");

const getStudentsWithPayments = async (req, res) => {
  const {
    session_id,
    payment_type_id,
    term_id,
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
    (!start_date || !end_date)
  ) {
    throw new BadRequestError(
      "At least one of session_id, term_id, payment_type_id or start_date, end_date is required."
    );
  }

  const query = {
    where: {},
    include: [
      {
        model: Student,
      },
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
    order: [["payment_date", "ASC"]], // Example default sorting
    offset: offset,
    limit: pageSize,
  };

  if (session_id) query.where.session_id = session_id;
  if (term_id) query.where.term_id = term_id;
  if (payment_type_id) query.where.payment_type_id = payment_type_id;

  if (start_date && end_date) {
    // Parse start_date and end_date using moment.js
    const parsedStartDate = moment(start_date, "YYYY-MM-DD", true);
    const parsedEndDate = moment(end_date, "YYYY-MM-DD", true);

    // Validate parsed dates
    if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
      throw new BadRequestError("Invalid date format. Use YYYY-MM-DD.");
    }

    // Set startDate and endDate for searching payments within the provided range
    const startDate = parsedStartDate.startOf("day").toDate();
    const endDate = parsedEndDate.endOf("day").toDate();

    // Update query to search payments between the provided dates
    query.where.payment_date = {
      [Op.between]: [startDate, endDate],
    };
  }

  const payments = await Payment.findAndCountAll(query);

  const totalPages = Math.ceil(payments.count / pageSize);

  // Format response
  const formattedPayments = payments.rows.map((payment) => ({
    student: {
      id: payment.Student.id,
      reg_numeber: payment.Student.reg_number,
      firstName: payment.Student.first_name,
      lastName: payment.Student.last_name,
      gender: payment.Student.gender,
      // Add other student details as needed
    },
    term: {
      id: payment.Term.id,
      name: payment.Term.term_name,
      session: {
        id: payment.Term.Session.id,
        name: payment.Term.Session.session_name,
        // Add other session details as needed
      },
    },
    amount: payment.amount,
    payment_status: payment.regular_payment ? "Not Outstanding" : "Outsatnding",
    payment_method: payment.amount_type,
    paymentDate: payment.payment_date,
    // Add other payment details as needed
  }));

  res.status(StatusCodes.OK).json({
    data: formattedPayments,
    pagination: {
      total: payments.count,
      pages: totalPages,
      currentPage: pageNumber,
      pageSize: pageSize,
    },
  });
};



module.exports = {
  getStudentsWithPayments,
};
