const yup = require("yup");

const createClassSchema = yup.object().shape({
  class_name: yup.string().required().max(20).min(4),
});

module.exports = {
  createClassSchema,
};
