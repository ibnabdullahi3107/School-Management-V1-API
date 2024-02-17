const { StatusCodes } = require("http-status-codes");
const { Class } = require("../../models");
const { Session, Term } = require("../../models");

const yup = require("yup");

const createClass = async (req, res) => {
  try {
    const { class_name, session_id, term_id } = req.body;

    const newClass = await Class.create({
      class_name,
      session_id,
      term_id,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getAllClassSchema = yup.object().shape({
  status: yup.string().optional(),
  sort: yup
    .string()
    .optional()
    .oneOf(["latest", "oldest", "a-z", "z-a"], "Invalid sort value"),
  page: yup.number().integer().positive().optional(),
  limit: yup.number().integer().positive().optional(),
  class_name: yup.string().max(255).optional(), 
});

const getAllClass = async (req, res) => {
  try {
    await getAllClassSchema.validate(req.query);

    const { status, sort } = req.query;

    const queryObject = {};

    // Check if req.user is defined before accessing its properties
    if (req.user && req.user.userId) {
      queryObject.createdBy = req.user.userId;
    }

    if (status && status !== "all") {
      queryObject.status = status;
    }

    let classes = await Class.findAll({
      where: queryObject,
      include: [
        { model: Session, attributes: ["id", "sessionName", "isActive"] },
        { model: Term, attributes: ["id", "term_name", "isActive"] },
      ],
      order: [], // Add your order conditions here based on 'sort' parameter
      offset: 0, // Set your offset value based on pagination
      limit: 10, // Set your limit value based on pagination
    });

    if (sort === "latest") {
      // Apply sorting logic if needed
    } else if (sort === "oldest") {
      // Apply sorting logic if needed
    } else if (sort === "a-z") {
      // Apply sorting logic if needed
    } else if (sort === "z-a") {
      // Apply sorting logic if needed
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Apply pagination
    classes = classes.slice(offset, offset + limit);

    // Fetch the total count for pagination
    const totalClasses = await Class.count({ where: queryObject });
    const numOfPages = Math.ceil(totalClasses / limit);

    res.status(StatusCodes.OK).json({ classes, totalClasses, numOfPages });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }
};

const getClass = async (req, res) => {
  try {
    const {
      params: { className },
    } = req;

    // Validate the query parameters against the schema
    await getAllClassSchema.validate(req.query);

    // Retrieve the class by name
    const singleClass = await Class.findOne({
      where: { class_name: className },
    });

    if (!singleClass) {
      throw new NotFoundError(`No class with name ${className}`);
    }

    // Send a success response with the retrieved class
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Class retrieved successfully",
      class: singleClass,
    });
  } catch (error) {
    // Handle validation errors or other errors
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: error.message });
  }
};

const updateClass = async (req, res) => {
  // Implement logic to update a class by ID
};

const deleteClass = async (req, res) => {
  // Implement logic to delete a class by ID
};

module.exports = {
  createClass,
  getAllClass,
  getClass,
  updateClass,
  deleteClass,
};
