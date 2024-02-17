const sessionsValidation = require("../validations/sessionValidate");
const termValidation = require("../validations/termValidation");
const classValidation = require("../validations/classValidation");
const schoolFeeValidation = require("../validations/schoolFeeValidation");
const studentsValidation = require("../validations/studentValidation");
const feeStructureValidation = require("../validations/feeStructureValidation"); // Correct import for fee structure validation
const feeAssignmentValidation = require("../validations/feeAssignmentValidation"); // Correct import for fee assignment validation
const { validateSchema } = require("./validationMiddleware");

const validateCreateSession = validateSchema(
  sessionsValidation.createSessionSchema
);
const validateUpdateSession = validateSchema(
  sessionsValidation.updateSessionSchema
);
const validateCreateTerm = validateSchema(termValidation.createTermSchema);
const validateCreateClass = validateSchema(classValidation.createClassSchema);
const validateCreateSchoolFee = validateSchema(
  schoolFeeValidation.createSchoolFeeSchema
);
const validateCreateStudent = validateSchema(
  studentsValidation.createStudentSchema
);
const validateUpdateStudent = validateSchema(
  studentsValidation.updateStudentSchema
);
const validateCreateFeeStructure = validateSchema(
  feeStructureValidation.createFeeStructureSchema
);
const validateUpdateFeeStructure = validateSchema(
  feeStructureValidation.updateFeeStructureSchema
);

const validateCreateFeeAssignment = validateSchema(
  feeAssignmentValidation.feeAssignmentSchema
);

module.exports = {
  validateCreateSession,
  validateUpdateSession,
  validateCreateTerm,
  validateCreateClass,
  validateCreateSchoolFee,
  validateCreateStudent,
  validateUpdateStudent,
  validateCreateFeeStructure,
  validateUpdateFeeStructure,
  validateCreateFeeAssignment,
};
