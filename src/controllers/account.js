const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const { Op } = require("sequelize");

const { Accounts } = require("../../models");

const createAccount = async (req, res) => {
  const { account_name, owner, account_permissions, notes, minimum_balance } =
    req.body;

  const newAccount = await Accounts.create({
    account_name,
    owner,
    account_permissions,
    notes,
    minimum_balance,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Account created successfully",
    account: newAccount,
  });
};


const getAllAccount = async (req, res) => {
  let whereClause = {}; // Initialize empty where clause

  // Check if query parameters are provided and construct search conditions
  if (req.query.accountName) {
    whereClause.account_name = { [Op.like]: `%${req.query.accountName}%` }; // Search by account name
  }

  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  // Fetch paginated accounts based on search criteria or all accounts if no criteria provided
  const { count: totalAccounts, rows: accounts } =
    await Accounts.findAndCountAll({
      where: whereClause,
      offset,
      limit,
    });

   const numOfPages = Math.ceil(totalAccounts / limit);

   // Respond with the matched accounts
   return res.status(StatusCodes.OK).json({ accounts, totalAccounts, numOfPages });

};

const getAccount = async (req, res) => {};

const updateAccount = async (req, res) => {};

const deleteAccount = async (req, res) => {};

module.exports = {
  createAccount,
  getAllAccount,
  getAccount,
  updateAccount,
  deleteAccount,
};
