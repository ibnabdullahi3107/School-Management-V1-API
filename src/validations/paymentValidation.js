const yup = require("yup");

const paymentValidationSchema = yup.object().shape({
  payment_date: yup.date().optional(),
  amount_type: yup.string().required().max(50),
  amount: yup.number().required().min(0),
  payment_type_id: yup.number().required().positive().integer(),
  student_id: yup.number().required().positive().integer(),
});

module.exports = {
  paymentValidationSchema,
};
