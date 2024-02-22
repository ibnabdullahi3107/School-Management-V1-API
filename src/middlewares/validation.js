const sessionsValidation = require("../validations/sessionValidate");
const termValidation = require("../validations/termValidation");
const classValidation = require("../validations/classValidation");
const studentsValidation = require("../validations/studentValidation");
const enrollmentValidation = require("../validations/enrollmentValidation");

const { validateSchema } = require("./validationMiddleware");

const validateCreateSession = validateSchema(
  sessionsValidation.createSessionSchema
);
const validateUpdateSession = validateSchema(
  sessionsValidation.updateSessionSchema
);
const validateCreateTerm = validateSchema(termValidation.createTermSchema);
const validateCreateClass = validateSchema(classValidation.createClassSchema);
const validateCreateStudent = validateSchema(
  studentsValidation.createStudentSchema
);
const validateUpdateStudent = validateSchema(
  studentsValidation.updateStudentSchema
);
const validateCreateEnrollment = validateSchema(enrollmentValidation.enrollmentValidation);

module.exports = {
  validateCreateSession,
  validateUpdateSession,
  validateCreateTerm,
  validateCreateClass,
  validateCreateStudent,
  validateUpdateStudent,
  validateCreateEnrollment,
};
