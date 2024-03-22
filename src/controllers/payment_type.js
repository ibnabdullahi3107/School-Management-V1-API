const { StatusCodes } = require("http-status-codes");
const { PaymentType } = require("../../models");
const yup = require("yup");

const { BadRequestError, NotFoundError } = require("../errors");

const createPaymentType = async (req, res) => {
  const { payment_type_name, amount } = req.body;

  // Create new payment type
  const newPaymentType = await PaymentType.create({
    payment_type_name,
    amount,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Payment type created successfully",
    paymentType: newPaymentType,
  });
};

const getAllPaymentTypeSchema = yup.object().shape({
  status: yup.string().optional(),
  sort: yup
    .string()
    .optional()
    .oneOf(["latest", "oldest", "a-z", "z-a"], "Invalid sort value"),
  page: yup.number().integer().positive().optional(),
  limit: yup.number().integer().positive().optional(),
});

const getAllPaymentType = async (req, res) => {
  // Validate the request query parameters using the Yup schema
  const {
    status,
    sort,
    page = 1,
    limit = 10,
  } = await getAllPaymentTypeSchema.validate(req.query).catch((error) => {
    throw new BadRequestError(error.message);
  });

  // Construct the query object based on the validated parameters
  const queryObject = {};
  if (status && status !== "all") {
    queryObject.status = status;
  }

  // Fetch payment types based on the query object
  let paymentTypes = await PaymentType.findAll({
    where: queryObject,
    order: [], // Add your order conditions here based on 'sort' parameter
    offset: (page - 1) * limit,
    limit: limit,
  });

  // Apply sorting based on the 'sort' query parameter
  if (sort === "latest") {
    paymentTypes = paymentTypes.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sort === "oldest") {
    paymentTypes = paymentTypes.sort((a, b) => a.createdAt - b.createdAt);
  } else if (sort === "a-z") {
    paymentTypes = paymentTypes.sort((a, b) =>
      a.payment_type_name.localeCompare(b.payment_type_name)
    );
  } else if (sort === "z-a") {
    paymentTypes = paymentTypes.sort((a, b) =>
      b.payment_type_name.localeCompare(a.payment_type_name)
    );
  }

  // Fetch the total count of payment types for pagination
  const totalPaymentTypes = await PaymentType.count({ where: queryObject });
  const numOfPages = Math.ceil(totalPaymentTypes / limit);

  // Respond with the fetched payment types, total count, and number of pages
  res.status(StatusCodes.OK).json({
    paymentTypes,
    totalPaymentTypes,
    numOfPages,
  });
};
const getPaymentType = async (req, res) => {
  const { id } = req.params;

  // Find the payment type by its primary key
  const paymentType = await PaymentType.findByPk(id);

  // If the payment type is not found, throw a NotFoundError
  if (!paymentType) {
    throw new NotFoundError(`Payment type with id ${id} not found`);
  }

  // Respond with the found payment type
  res.status(StatusCodes.OK).json({ paymentType });
};
const updatePaymentType = async (req, res) => {
  const { id } = req.params;

  // Check if a payment type with the provided ID exists in the database
  const existingPaymentType = await PaymentType.findByPk(id);

  if (!existingPaymentType) {
    throw new NotFoundError(`Payment type with ID ${id} not found`);
  }

  // Extract the updated payment type details from the request body
  const { payment_type_name, amount } = req.body;

  if (!payment_type_name && !amount) {
    throw new BadRequestError(
      "Either payment type name or amount is required for update"
    );
  }
  // Update the payment type record in the database
  await existingPaymentType.update({
    payment_type_name,
    amount,
  });

  // Send a success response with the updated payment type details
  res.status(StatusCodes.OK).json({
    success: true,
    message: `Payment type ID ${id} updated successfully`,
    paymentType: existingPaymentType,
  });
};
const deletePaymentType = async (req, res) => {
  const { id } = req.params;

  // Check if the payment type exists
  const paymentType = await PaymentType.findByPk(id);
  if (!paymentType) {
    throw new NotFoundError(`Payment type with id ${id} not found`);
  }

  // Delete the payment type
  await PaymentType.destroy({
    where: {
      id: id,
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: `Payment type with id ${id} has been deleted successfully`,
  });
  
};

module.exports = {
  createPaymentType,
  getAllPaymentType,
  getPaymentType,
  updatePaymentType,
  deletePaymentType,
};
