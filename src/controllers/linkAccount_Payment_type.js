const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const { Op } = require("sequelize");

const { PaymentTypeAccount, Accounts, PaymentType } = require("../../models");

const createPaymentTypeAccount = async (req, res) => {
  const { payment_type_id, account_id } = req.body;

  const paymentType = await PaymentType.findByPk(payment_type_id);
  if (!paymentType) {
    throw new NotFoundError(
      `Payment type with id ${payment_type_id} not found.`
    );
  }

  const account = await Accounts.findByPk(account_id);
  if (!account) {
    throw new NotFoundError(`Account with id ${account_id} not found.`);
  }

  const newPaymentTypeAccount = await PaymentTypeAccount.create({
    payment_type_id,
    account_id,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Link Payment Type with Account created successfully",
    payment_type_account: newPaymentTypeAccount,
  });
};

const getAllPaymentTypeAccount = async (req, res) => {
  let whereClause = {}; // Initialize empty where clause

  // Check if query parameters are provided and construct search conditions
  if (req.query.accountName) {
    whereClause.account_name = { [Op.like]: `%${req.query.accountName}%` }; // Search by account name
  }

  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  // Fetch paginated payment type accounts based on search criteria or all payment type accounts if no criteria provided
  const { count: totalAccounts, rows: paymentTypeAccounts } =
    await PaymentTypeAccount.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      include: [
        // Include associated PaymentType and Account models
        { model: PaymentType, attributes: ["payment_type_name", "amount"] },
        { model: Accounts, attributes: ["account_name", "account_status", "balance", "minimum_balance", "owner", "notes" ] },
      ],
    });

  const numOfPages = Math.ceil(totalAccounts / limit);

  // Respond with the matched payment type accounts along with associated details
  return res
    .status(StatusCodes.OK)
    .json({ paymentTypeAccounts, totalAccounts, numOfPages });
};

const getPaymentTypeAccount = async (req, res) => {};

const updatePaymentTypeAccount = async (req, res) => {};

const deletePaymentTypeAccount = async (req, res) => {};

module.exports = {
  createPaymentTypeAccount,
  getAllPaymentTypeAccount,
  getPaymentTypeAccount,
  updatePaymentTypeAccount,
  deletePaymentTypeAccount,
};
