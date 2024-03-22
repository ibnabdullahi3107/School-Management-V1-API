const { StatusCodes } = require("http-status-codes");
// const moment = require("moment");
const {
  Payment,
  Student,
  Class,
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
  const {
    student_id,
    session_id,
    term_id,
    payment_type_id,
    discount_amount,
  } = req.body;

  // Check if the discount already exists for the given combination
  const existingDiscount = await Discount.findOne({
    where: {
      student_id,
      session_id,
      term_id,
      payment_type_id,
    },
  });

  if (existingDiscount) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: "A discount already exists for this combination",
    });
  }

  // Check if the provided student, session, term, and payment type IDs exist
  const [student, session, term, paymentType] = await Promise.all([
    Student.findByPk(student_id),
    Session.findByPk(session_id),
    Term.findByPk(term_id),
    PaymentType.findByPk(payment_type_id),
  ]);

  if (!student) {
    throw new NotFoundError(`No student found with ID number ${student_id}.`);
  }

  if (!session) {
    throw new NotFoundError(`No session found with ID number ${session_id}.`);
  }

  if (!term) {
    throw new NotFoundError(`No term found with ID number ${term_id}.`);
  }

  if (!paymentType) {
    throw new NotFoundError(
      `No payment type found with ID number ${payment_type_id}.`
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
  const {
    params: { id },
    body: updateFields,
  } = req;

  let discount = await Discount.findByPk(id);

  if (!discount) {
    throw new NotFoundError(`Discount with ID ${id} not found.`);
  }

  // Validate and update each attribute
  for (const key in updateFields) {
    if (Object.hasOwnProperty.call(updateFields, key)) {
      discount[key] = updateFields[key];
    }
  }

  // Save the updated discount
  await discount.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Discount updated successfully",
    discount: discount,
  });
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
