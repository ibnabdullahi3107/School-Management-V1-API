const express = require("express");
const router = express.Router();
const { validateCreateStudent } = require("../middlewares/validation");
const {
  createStudent,
  deleteStudent,
  getAllStudents,
  updateStudent,
  getStudent,
} = require("../controllers/student");

router
  .route("/")
  .post(validateCreateStudent, createStudent)
  .get(getAllStudents);

router
  .route("/:reg_number([^/]+/[^/]+/[^/]+)")
  .get(getStudent)
  .patch(updateStudent)
  .delete(deleteStudent);

module.exports = router;
