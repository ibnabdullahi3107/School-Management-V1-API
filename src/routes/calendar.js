const express = require("express");
const router = express.Router();
const { showCalendar } = require("../controllers/terms");

router.route("/").get(showCalendar);

module.exports = router;
