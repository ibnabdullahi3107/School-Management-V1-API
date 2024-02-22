const express = require("express");
const router = express.Router();
const { validateCreateEnrollment } = require("../middlewares/validation");

const {
  enrollStudent,
  getAllEnrollStudents,
  updateEnrollStudent,
  getEnrollStudent,
  deleteEnrollStudent,
  getEnrollStudentsAndCountByTerm,
  getEnrollStudentsByClass,
  getEnrollStudentsTermAndClass,
} = require("../controllers/enrollments");

// Endpoint to enroll a student
router.route("/").post(validateCreateEnrollment, enrollStudent);

// Endpoint to get all enrollments
router.route("/").get(getAllEnrollStudents);

router
  .route("/:enrollment_id")
  .get(getEnrollStudent)
  .patch(updateEnrollStudent)
  .delete(deleteEnrollStudent);

router.route("/term/:term_id").get(getEnrollStudentsAndCountByTerm);

router.route("/class/:class_id").get(getEnrollStudentsByClass);

router
  .route("/term/:term_id/class/:class_id")
  .get(getEnrollStudentsTermAndClass);

module.exports = router;
