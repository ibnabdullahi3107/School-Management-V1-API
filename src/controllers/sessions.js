const { StatusCodes } = require("http-status-codes");
// const moment = require("moment");
const { Session } = require("../../models");
// const { Op } = require("sequelize");
const yup = require("yup");

const { BadRequestError, NotFoundError } = require("../errors");

const createSession = async (req, res) => {
  const { session_name } = req.body;

  // Use Sequelize's create method to insert a new record
  const newSession = await Session.create({
    session_name,
  });

  // Send a success response with the created session
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Session created successfully",
    session: newSession,
  });
};

const getAllSessionSchema = yup.object().shape({
  status: yup.string().optional(),
  sort: yup
    .string()
    .optional()
    .oneOf(["latest", "oldest", "a-z", "z-a"], "Invalid sort value"),
  page: yup.number().integer().positive().optional(),
  limit: yup.number().integer().positive().optional(),
  // Add more validation rules for other query parameters as needed
});

const getAllSessions = async (req, res) => {
 
    await getAllSessionSchema.validate(req.query);

    const { status, sort } = req.query;

    const queryObject = {};

    // Check if req.user is defined before accessing its properties
    if (req.user && req.user.userId) {
      queryObject.createdBy = req.user.userId;
    }

    if (status && status !== "all") {
      queryObject.status = status;
    }

    // Modify your logic to fetch sessions based on validated query parameters
    let sessions = await Session.findAll({
      where: queryObject,
      order: [], // Add your order conditions here based on 'sort' parameter
      offset: 0, // Set your offset value based on pagination
      limit: 10, // Set your limit value based on pagination
    });

    // Apply sorting based on the 'sort' query parameter
    if (sort === "latest") {
      sessions = sessions.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === "oldest") {
      sessions = sessions.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sort === "a-z") {
      sessions = sessions.sort((a, b) => a.position.localeCompare(b.position));
    } else if (sort === "z-a") {
      sessions = sessions.sort((a, b) => b.position.localeCompare(a.position));
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Apply pagination
    sessions = sessions.slice(offset, offset + limit);

    // Fetch the total count for pagination
    const totalSessions = await Session.count({ where: queryObject });
    const numOfPages = Math.ceil(totalSessions / limit);

    res.status(StatusCodes.OK).json({ sessions, totalSessions, numOfPages });
 
};

const getSession = async (req, res) => {
  // Extract the session ID from the request parameters
  const sessionId = req.params.id;

  // Find the session by its ID
  const session = await Session.findByPk(sessionId);

  // Check if the session exists
  if (!session) {
    throw new NotFoundError(`Session ID ${sessionId} not found`);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Session retrieved successfully",
    session,
  });
};

const updateSession = async (req, res) => {
  const { id } = req.params;

  // Check if a session with the provided ID exists in the database
  const existingSession = await Session.findByPk(id);

  // Extract the updated session details from the request body
  const { session_name } = req.body;

  if (session_name === "") {
    throw new BadRequestError("Session fields cannot be empty");
  }

  // Use Sequelize's update method to update the session record in the database
  await existingSession.update({
    session_name,
  });

  if (!existingSession) {
    throw new NotFoundError(`Session ID ${sessionId} not found`);
  }
  // Send a success response with the updated session details
  res.status(StatusCodes.OK).json({
    success: true,
    message: `Session id ${id} updated successfully`,
    session: existingSession,
  });
};

const deleteSession = async (req, res) => {

    const { id } = req.params;

    // Check if a session with the provided ID exists in the database
    const session = await Session.findByPk(id);
    if (!session) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `Session id ${id} not found`,
      });
    }

    await session.destroy();

    // Send a success response
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Session id ${id} deleted successfully`,
    });
  
};

module.exports = {
  createSession,
  getAllSessions,
  getSession,
  updateSession,
  deleteSession,
};
