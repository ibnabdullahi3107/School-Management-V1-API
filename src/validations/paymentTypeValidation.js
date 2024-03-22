const yup = require("yup");

const createPaymentTypeSchema = yup.object().shape({
  payment_type_name: yup.string().required().max(50),
  amount: yup.number().required().min(0),
});

module.exports = {
  createPaymentTypeSchema,
};
