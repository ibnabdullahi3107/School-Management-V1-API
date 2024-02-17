const express = require("express");
const router = express.Router();
const { validateCreateTerm } = require("../middlewares/validation");
const {
  createTerm,
  deleteTerm,
  getAllTerm,
  updateTerm,
  getTerm,
} = require("../controllers/terms");

router.route("/").post(validateCreateTerm, createTerm).get(getAllTerm);

router.route("/:term_id").get(getTerm).patch(updateTerm).delete(deleteTerm);

module.exports = router;
