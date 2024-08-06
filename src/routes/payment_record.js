const express = require("express");
const router = express.Router();

const { getStudentsWithPayments } = require("../controllers/payment_record");

router.route("/").get(getStudentsWithPayments);

router.route("/:id");

module.exports = router;
