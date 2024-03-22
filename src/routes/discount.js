const express = require("express");
const router = express.Router();
const { validateCreateDiscount } = require("../middlewares/validation");
const {
  create_Process_Discount,
  getAll_Process_Discount,
  get_Process_Discount,
  update_Process_Discount,
  delete_Process_Discount,
} = require("../controllers/discount");

router
  .route("/")
  .post(validateCreateDiscount, create_Process_Discount)
  .get(getAll_Process_Discount);

router
  .route("/:id")
  .get(get_Process_Discount)
  .patch(update_Process_Discount)
  .delete(delete_Process_Discount);

module.exports = router;
