// Example validation schema for a POST request body
const yup = require("yup");

const createSessionSchema = yup.object().shape({
  session_name: yup.string().required(),
});

const updateSessionSchema = yup.object().shape({
  session_name: yup.string().required(),
});

module.exports = {
  createSessionSchema,
  updateSessionSchema,
};
