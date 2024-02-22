const { StatusCodes } = require("http-status-codes");
// const moment = require("moment");
const { Term, Class, Student, Enrollment } = require("../../models");
const { Op } = require("sequelize");

const {
  applySortingAndPagination,
  getSortingOrder,
} = require("../services/sortdata");

const { BadRequestError, NotFoundError } = require("../errors");

const enrollStudent = async (req, res) => {
  const { student_id, class_id, term_id } = req.body;

  // Check if the student exists
  const student = await Student.findByPk(student_id);
  if (!student) {
    throw new NotFoundError(`No student found with ID number ${student_id}.`);
  }

  // Check if the class exists
  const classObj = await Class.findByPk(class_id);
  if (!classObj) {
    throw new NotFoundError(`Class with id ${class_id} not found.`);
  }

  // Check if the term exists
  const term = await Term.findByPk(term_id);
  if (!term) {
    throw new NotFoundError(`No term with id ${term_id}.`);
  }

  // Check if the student is already enrolled in the class for the term
  const existingEnrollment = await Enrollment.findOne({
    where: {
      student_id: student_id,
      class_id: class_id,
      term_id: term_id,
    },
  });

  if (existingEnrollment) {
    throw new BadRequestError(
      "Student is already enrolled in the class for the term."
    );
  }

  // Create the enrollment
  const enrollment = await Enrollment.create({
    student_id: student_id,
    class_id: class_id,
    term_id: term_id,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Enrollment student to class of term created successfully",
    enrollment: enrollment,
  });
};

const getAllEnrollStudents = async (req, res) => {
  try {
    const { status, sort, search, last_name, first_name, reg_number } =
      req.query;

    const queryObject = {};
    if (status && status !== "all") queryObject.status = status;
    if (last_name) queryObject.last_name = { [Op.iLike]: `%${last_name}%` };
    if (first_name) queryObject.first_name = { [Op.iLike]: `%${first_name}%` };
    if (reg_number) queryObject.reg_number = { [Op.iLike]: `%${reg_number}%` };

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const enrollments = await Enrollment.findAndCountAll({
      where: queryObject,
      include: [
        {
          model: Student,
          attributes: [
            "id",
            "first_name",
            "last_name",
            "is_active",
            "gender",
            "local_government_area",
          ],
        },
        {
          model: Class,
          attributes: ["class_id", "class_name"],
        },
        {
          model: Term,
          attributes: ["term_id", "term_name"],
        },
      ],
      order: getSortingOrder(sort),
      offset,
      limit,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: enrollments.rows,
      pagination: {
        total: enrollments.count,
        pages: Math.ceil(enrollments.count / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};

const getEnrollStudent = async (req, res) => {
  const { enrollment_id } = req.params;

  const enrollment = await Enrollment.findByPk(enrollment_id, {
    include: [
      {
        model: Student,
        attributes: [
          "id",
          "first_name",
          "last_name",
          "is_active",
          "gender",
          "local_government_area",
        ],
      },
      {
        model: Class,
        attributes: ["class_id", "class_name"],
      },
      {
        model: Term,
        attributes: ["term_id", "term_name"],
      },
    ],
  });

  if (!enrollment) {
    throw new NotFoundError(`Enrollment with ID ${enrollment_id} not found.`);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: enrollment,
  });
};

const getEnrollStudentsAndCountByTerm = async (req, res) => {
  const { term_id } = req.params;
  const { page = 1, limit = 10, status, search } = req.query;

  // Construct filter conditions
  const filterConditions = { term_id: term_id };
  if (status) filterConditions.status = status;
  if (search) {
    filterConditions[Op.or] = [
      { "$Student.first_name$": { [Op.iLike]: `%${search}%` } },
      { "$Student.last_name$": { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Retrieve enrollments by term with pagination and filtering
  const enrollments = await Enrollment.findAll({
    where: filterConditions,
    include: [
      {
        model: Student,
        attributes: [],
        attributes: [
          "id",
          "reg_number",
          "first_name",
          "last_name",
          "date_of_birth",
          "is_active",
          "gender",
          "address",
          "local_government_area",
        ],
      },
      {
        model: Class,
        attributes: ["class_id", "class_name"],
      },
      {
        model: Term,
        attributes: ["term_id", "term_name", "start_date", "end_date"],
      },
    ],
    offset: (page - 1) * limit,
    limit: limit,
  });

  // Retrieve the count of enrolled students for the given term
  const count = await Enrollment.count({ where: filterConditions });

  // Return the list of enrollments, count, and pagination info
  res.status(StatusCodes.OK).json({
    success: true,
    data: enrollments,
    count: count,
    pagination: {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      pageSize: parseInt(limit),
    },
  });
};

const getEnrollStudentsByClass = async (req, res) => {
  const { class_id } = req.params;
  const { page = 1, limit = 10, status, search } = req.query;

  // Construct filter conditions
  const filterConditions = { class_id: class_id };
  if (status) filterConditions.status = status;
  if (search) {
    filterConditions[Op.or] = [
      { "$Student.first_name$": { [Op.iLike]: `%${search}%` } },
      { "$Student.last_name$": { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Retrieve enrollments by class with pagination and filtering
  const enrollments = await Enrollment.findAll({
    where: filterConditions,
    include: [
      {
        model: Student,
        attributes: ["id", "first_name", "last_name"],
      },
      {
        model: Class,
        attributes: ["class_id", "class_name"],
      },
      {
        model: Term,
        attributes: ["term_id", "term_name", "start_date", "end_date"],
      },
    ],
    offset: (page - 1) * limit,
    limit: limit,
  });

  // Retrieve the count of enrolled students for the given class
  const count = await Enrollment.count({ where: filterConditions });

  // Return the list of enrollments, count, and pagination info
  res.status(StatusCodes.OK).json({
    success: true,
    data: enrollments,
    count: count,
    pagination: {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      pageSize: parseInt(limit),
    },
  });
};

const getEnrollStudentsTermAndClass = async (req, res) => {
  try {
    const { term_id, class_id } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;

    // Construct filter conditions
    const filterConditions = { term_id: term_id, class_id: class_id };
    if (status) filterConditions.status = status;
    if (search) {
      filterConditions[Op.or] = [
        { "$Student.first_name$": { [Op.iLike]: `%${search}%` } },
        { "$Student.last_name$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Retrieve enrollments by term and class with pagination and filtering
    const enrollments = await Enrollment.findAll({
      where: filterConditions,
      include: [
        {
          model: Student,
          attributes: ["id", "first_name", "last_name"],
        },
        {
          model: Class,
          attributes: ["class_id", "class_name"],
        },
        {
          model: Term,
          attributes: ["term_id", "term_name", "start_date", "end_date"],
        },
      ],
      offset: (page - 1) * limit,
      limit: limit,
    });

    // Retrieve the count of enrolled students for the given term and class
    const count = await Enrollment.count({ where: filterConditions });

    // Return the list of enrollments, count, and pagination info
    res.status(StatusCodes.OK).json({
      success: true,
      data: enrollments,
      count: count,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message,
    });
  }
};

const updateEnrollStudent = async (req, res) => {
  const { enrollment_id } = req.params;

  const { student_id, class_id, term_id } = req.body;

  const enrollment = await Enrollment.findByPk(enrollment_id);

  if (!enrollment) {
    throw new NotFoundError(`No enrollment with id ${enrollment_id}`);
  }

  // Update enrollment details
  if (student_id) {
    enrollment.student_id = student_id;
  }
  if (class_id) {
    enrollment.class_id = class_id;
  }
  if (term_id) {
    enrollment.term_id = term_id;
  }

  // Save the updated enrollment
  await enrollment.save();

  res.status(StatusCodes.OK).send();
};

const deleteEnrollStudent = async (req, res) => {

    const { enrollment_id } = req.params;

    const enrollment = await Enrollment.findByPk(enrollment_id);

    if (!enrollment) {
      throw new NotFoundError(`No enrollment with id ${enrollment_id}`);
    }

    // Delete the enrollment
    await enrollment.destroy();

    res.status(StatusCodes.OK).send();
 
};

module.exports = {
  enrollStudent,
  getAllEnrollStudents,
  getEnrollStudentsAndCountByTerm,
  getEnrollStudentsByClass,
  getEnrollStudentsTermAndClass,
  getEnrollStudent,
  updateEnrollStudent,
  deleteEnrollStudent,
};
