const yup = require("yup");

const createStudentSchema = yup.object().shape({
  first_name: yup.string().required().max(255),
  last_name: yup.string().required().max(255),
  date_of_birth: yup.date().required(),
  gender: yup.string().required().max(255),
  class_id: yup.number().required(),
  term_id: yup.number().required(),
  address: yup.string().required().trim().max(255),
  local_government_area: yup.string().required().trim().max(255),
  next_of_kin_name: yup.string().required().trim().max(255),
  next_of_kin_phone_number: yup
    .string()
    .required()
    .trim()
    .max(20)
    .matches(/^\d+$/, "Must be a valid phone number"),
  next_of_kin_address: yup.string().required().trim().max(255),
  next_of_kin_relation: yup.string().required().trim().max(255),
});

const updateStudentSchema = yup
  .object()
  .shape({
    first_name: yup.string().max(255),
    last_name: yup.string().max(255),
    date_of_birth: yup.date(),
    gender: yup.string().trim().max(255),
    address: yup.string().trim().max(255),
    local_government_area: yup.string().trim().max(255),
    class_id: yup.number().required(),
    term_id: yup.number().required(),
    next_of_kin_name: yup.string().trim().max(255),
    next_of_kin_phone_number: yup
      .string()
      .trim()
      .max(20)
      .matches(/^\d+$/, "Must be a valid phone number"),
    next_of_kin_address: yup.string().trim().max(255),
    next_of_kin_relation: yup.string().trim().max(255),
  })
  .test(
    "at-least-one",
    "At least one field must be provided for update",
    (value) => {
      return Object.values(value).some((v) => v !== undefined && v !== null);
    }
  );

module.exports = {
  createStudentSchema,
  updateStudentSchema,
};
