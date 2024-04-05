const { StatusCodes } = require("http-status-codes");
// const moment = require("moment");
const {
  Payment,
  Student,
  OutstandingBalance,
  Term,
  PaymentType,
  Discount,
  Session,
} = require("../../models");
const { Op } = require("sequelize");

const {
  applySortingAndPagination,
  getSortingOrder,
} = require("../services/sortdata");

const { BadRequestError, NotFoundError } = require("../errors");

const create_Process_Discount = async (req, res) => {
  const { student_id, payment_type_id, discount_amount } = req.body;

  // Check if the provided student and payment type IDs exist
  const [student, paymentType, outstandingBalance] = await Promise.all([
    Student.findByPk(student_id),
    PaymentType.findByPk(payment_type_id),
    OutstandingBalance.findOne({
      where: {
        student_id,
        payment_type_id,
      },
    }),
  ]);

  if (!student) {
    throw new NotFoundError(`No student found with ID number ${student_id}.`);
  }

  if (!paymentType) {
    throw new NotFoundError(
      `No payment type found with ID number ${payment_type_id}.`
    );
  }

  let session_id, term_id;

  if (outstandingBalance) {
    // Retrieve session_id and term_id from the outstanding balance
    session_id = outstandingBalance.session_id;
    term_id = outstandingBalance.term_id;

    // Check if the discount already exists for the given combination
    const existingDiscount = await Discount.findOne({
      where: {
        student_id,
        payment_type_id,
        session_id,
        term_id,
      },
    });

    if (existingDiscount) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: "A discount already exists for this combination",
      });
    }

    // Deduct discount amount from outstanding balance
    const updatedAmount = outstandingBalance.amount - discount_amount;
    if (updatedAmount <= 0) {
      // If the updated amount is zero or negative, delete the outstanding balance
      await outstandingBalance.destroy();
    } else {
      // Otherwise, update the outstanding balance with the remaining amount
      await outstandingBalance.update({ amount: updatedAmount });
    }
  } else {
    throw new NotFoundError(
      `No outstanding balance found for student with ID number ${student_id}.`
    );
  }

  // Create the discount
  const newDiscount = await Discount.create({
    student_id,
    session_id,
    term_id,
    payment_type_id,
    discount_amount,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Discount created successfully",
    discount: newDiscount,
  });
};

const getAll_Process_Discount = async (req, res) => {
  const { term_id, session_id, student_id, search } = req.query;

  // Construct the filter object based on the provided query parameters
  const filter = {};
  if (term_id) filter.term_id = term_id;
  if (session_id) filter.session_id = session_id;
  if (student_id) filter.student_id = student_id;

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

  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  // Find and count discounts based on the filter object
  const { count, rows } = await Discount.findAndCountAll({
    where: filter,
    include: [
      {
        model: Student,
        attributes: [
          "id",
          "reg_number",
          "first_name",
          "last_name",
          // Add other student attributes you want to include
        ],
        where: searchTextFilter, // Apply text search
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
    throw new NotFoundError("No discounts found.");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Discounts retrieved successfully",
    discounts: rows,
    pagination: {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  });
};

const get_Process_Discount = async (req, res) => {
  const { id } = req.params;

  // Find the discount by its ID
  const discount = await Discount.findByPk(id, {
    include: [
      {
        model: Student,
        attributes: [
          "id",
          "reg_number",
          "first_name",
          "last_name",
          // Add other student attributes you want to include
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

  // If discount is not found, throw a NotFoundError
  if (!discount) {
    throw new NotFoundError(`Discount with ID ${id} not found.`);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Discount retrieved successfully",
    discount,
  });
};

const update_Process_Discount = async (req, res) => {
 
};

const delete_Process_Discount = async (req, res) => {
  const { id } = req.params;

  // Find the discount by its ID
  const discount = await Discount.findByPk(id);

  if (!discount) {
    throw new NotFoundError(`Discount with ID ${id} not found.`);
  }

  // Delete the payment
  await discount.destroy();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Discount deleted successfully",
  });
};

module.exports = {
  create_Process_Discount,
  getAll_Process_Discount,
  get_Process_Discount,
  update_Process_Discount,
  delete_Process_Discount,
};
