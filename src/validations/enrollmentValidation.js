// Create enrollment validation
const yup = require("yup");

const enrollmentValidation = yup.object().shape({
    student_id: yup.number().required(),
    class_id: yup.number().required(),
    term_id: yup.number().required(),
});

module.exports = {
    enrollmentValidation,
};

