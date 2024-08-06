const express = require('express');
const router = express.Router();


const {
  createPaymentTypeAccount,
  getAllPaymentTypeAccount,
  getPaymentTypeAccount,
  updatePaymentTypeAccount,
  deletePaymentTypeAccount,
} = require("../controllers/linkAccount_Payment_type");

router.route("/").post(createPaymentTypeAccount).get(getAllPaymentTypeAccount);

router
  .route("/:id")
  .get(getPaymentTypeAccount)
  .patch(updatePaymentTypeAccount)
  .delete(deletePaymentTypeAccount);

module.exports = router;

