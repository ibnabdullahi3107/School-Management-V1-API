const express = require("express");
const router = express.Router();
const { validateCreatePayment } = require("../middlewares/validation");
const {
  create_Process_Payment,
  getAll_Process_Payment,
  get_Process_Payment,
  update_Process_Payment,
  delete_Process_Payment,
  getStudentsWithPayments,
} = require("../controllers/payment");

router
  .route("/")
  .post(validateCreatePayment, create_Process_Payment)
  .get(getAll_Process_Payment)
  .get(getStudentsWithPayments);

router
  .route("/:id")
  .get(get_Process_Payment)
  .patch(update_Process_Payment)
  .delete(delete_Process_Payment);

module.exports = router;
