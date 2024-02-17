const yup = require("yup");

const createClassSchema = yup.object().shape({
  class_name: yup.string().required(),
  session_id: yup.number().required(),
  term_id: yup.number().required(),
});

module.exports = {
  createClassSchema,
};
