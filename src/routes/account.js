const express = require('express');
const router = express.Router();
const { validateCreateAccount } = require("../middlewares/validation");


const {
  createAccount,
  getAllAccount,
  getAccount,
  updateAccount,
  deleteAccount,
} = require("../controllers/account");

router.route("/").post(validateCreateAccount, createAccount).get(getAllAccount);

router.route("/:id").get(getAccount).patch(updateAccount).delete(deleteAccount);

module.exports = router;

