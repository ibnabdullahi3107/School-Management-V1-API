const express = require("express");
const router = express.Router();
const {
  validateCreateSession,
  validateUpdateSession,
} = require("../middlewares/validation");
const {
  createSession,
  deleteSession,
  getAllSessions,
  updateSession,
  getSession,
} = require("../controllers/sessions");

router
  .route("/")
  .post(validateCreateSession, createSession)
  .get(getAllSessions);

router
  .route("/:id")
  .get(getSession)
  .patch(validateUpdateSession, updateSession)
  .delete(deleteSession);

module.exports = router;
