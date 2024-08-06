const express = require("express");
const router = express.Router();

const { getTransactionRecords } = require("../controllers/transaction_record");

router.route("/").get(getTransactionRecords);

module.exports = router;
