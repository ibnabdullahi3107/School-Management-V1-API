const sessionsValidation = require("../validations/sessionValidate");
const termValidation = require("../validations/termValidation");
const classValidation = require("../validations/classValidation");
const studentsValidation = require("../validations/studentValidation");
const enrollmentValidation = require("../validations/enrollmentValidation");
const paymentTypeValidation = require("../validations/paymentTypeValidation");
const paymentValidation = require("../validations/paymentValidation");
const discountValidation = require("../validations/discountValidation");


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
const validateCreateEnrollment = validateSchema(
  enrollmentValidation.enrollmentValidation
);

const validateCreatePaymentType = validateSchema(
  paymentTypeValidation.createPaymentTypeSchema
);

const validateCreatePayment = validateSchema(
  paymentValidation.paymentValidationSchema
);

const validateCreateDiscount = validateSchema(
  discountValidation.discountValidationSchema
);

module.exports = {
  validateCreateSession,
  validateUpdateSession,
  validateCreateTerm,
  validateCreateClass,
  validateCreateStudent,
  validateUpdateStudent,
  validateCreateEnrollment,
  validateCreatePaymentType,
  validateCreatePayment,
  validateCreateDiscount,
};
