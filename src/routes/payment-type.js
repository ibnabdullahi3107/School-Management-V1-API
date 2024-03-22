const express = require("express");
const router = express.Router();
const { validateCreatePaymentType } = require("../middlewares/validation");
const {
  createPaymentType,
  deletePaymentType,
  getAllPaymentType,
  updatePaymentType,
  getPaymentType,
} = require("../controllers/payment_type");

router
  .route("/")
  .post(validateCreatePaymentType, createPaymentType)
  .get(getAllPaymentType);

router
  .route("/:id")
  .get(getPaymentType)
  .patch(updatePaymentType)
  .delete(deletePaymentType);

module.exports = router;
