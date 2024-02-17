const express = require("express");
const router = express.Router();
const { validateCreateClass } = require("../middlewares/validation");
const {
  createClass,
  deleteClass,
  getAllClass,
  updateClass,
  getClass,
} = require("../controllers/classes");

router.route("/").post(validateCreateClass, createClass).get(getAllClass);

router.route("/:id").get(getClass).patch(updateClass).delete(deleteClass);

module.exports = router;
