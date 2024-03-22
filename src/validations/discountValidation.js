const yup = require("yup");

const discountValidationSchema = yup.object().shape({
  discount_amount: yup.number().required().min(0),
  payment_type_id: yup.number().required().positive().integer(),
  term_id: yup.number().required().positive().integer(),
  session_id: yup.number().required().positive().integer(),
  student_id: yup.number().required().positive().integer(),
});

module.exports = {
  discountValidationSchema,
};
