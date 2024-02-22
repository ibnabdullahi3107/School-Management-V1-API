const { StatusCodes } = require("http-status-codes");
const { Class } = require("../../models");

const { BadRequestError, NotFoundError } = require("../errors");

const yup = require("yup");

const createClass = async (req, res) => {
  const { class_name } = req.body;

  const newClass = await Class.create({
    class_name,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Class created successfully",
    class: newClass,
  });
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
  await getAllClassSchema.validate(req.query);

  const { status, sort, page = 1, limit = 10 } = req.query;

  const queryObject = {};
  if (status && status !== "all") {
    queryObject.status = status;
  }

  // Define sorting order
  let order = [["createdAt", "DESC"]]; // Default sorting
  switch (sort) {
    case "latest":
      order = [["createdAt", "DESC"]];
      break;
    case "oldest":
      order = [["createdAt", "ASC"]];
      break;
    case "a-z":
      order = [["class_name", "ASC"]];
      break;
    case "z-a":
      order = [["class_name", "DESC"]];
      break;
  }

  // Pagination parameters
  const paginationLimit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
  const offset =
    (parseInt(page, 10) > 0 ? parseInt(page, 10) - 1 : 0) * paginationLimit;

  // Fetch paginated and sorted classes
  const { count: totalClasses, rows: classes } = await Class.findAndCountAll({
    where: queryObject,
    order,
    offset,
    limit: paginationLimit,
  });

  const numOfPages = Math.ceil(totalClasses / paginationLimit);

  res.status(StatusCodes.OK).json({ classes, totalClasses, numOfPages });
};

const getClass = async (req, res) => {
  const { id } = req.params;

  const class_id = await Class.findByPk(id);

  if (!class_id) {
    throw new NotFoundError(`Class with id ${id} not found`);
  }

  res.status(StatusCodes.OK).json({ class_id });
};

const updateClass = async (req, res) => {
  const { id } = req.params;
  const { class_name } = req.body;

  if (!class_name) {
    throw new BadRequestError("Class name is required");
  }

  const class_id = await Class.findByPk(id);

  if (!class_id) {
    throw new NotFoundError(`Class with id ${id} not found`);
  }

  class_id.class_name = class_name;

  await class_id.save();

  res.status(StatusCodes.OK).json({ class_id });
};

const deleteClass = async (req, res) => {
  const { id } = req.params;

  const class_id = await Class.findByPk(id);

  if (!class_id) {
       throw new NotFoundError(`Class with id ${id} not found`);
  }

  await class_id.destroy();

  res
    .status(StatusCodes.OK)
    .json({ message: `Class with id ${id} has been deleted` });
};

module.exports = {
  createClass,
  getAllClass,
  getClass,
  updateClass,
  deleteClass,
};
