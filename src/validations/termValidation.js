const yup = require("yup");

const createTermSchema = yup.object().shape({
  session_id: yup.number().required(),
  term_name: yup.string().required(),
  start_date: yup.date().required(),
  end_date: yup.date().required(),
  next_term_date: yup.date().required(),
});

module.exports = {
  createTermSchema,
};
