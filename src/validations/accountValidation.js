const yup = require("yup");

const createAccountSchema = yup.object().shape({
    minimum_balance: yup.number().min(0),
    owner: yup.string().required().max(255).min(4),
    account_permissions: yup.string().required().max(255).min(4),
    account_name: yup.string().required().max(100).min(4),
});

module.exports = {
  createAccountSchema,
};