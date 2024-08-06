const express = require("express");
const router = express.Router();

const {
  getStudentsWithReceipts,
  getByReceiptNumber,
} = require("../controllers/receipt_record");

router.route("/").get(getStudentsWithReceipts);

router.route("/:receipt_number").get(getByReceiptNumber);

module.exports = router;
