const { StatusCodes } = require("http-status-codes");
const { Session, Term } = require("../../models");
const { BadRequestError, NotFoundError } = require("../errors");
const moment = require("moment");

const yup = require("yup");

const createTerm = async (req, res) => {
  const { session_id, term_name, start_date, end_date, next_term_date } =
    req.body;

  // Find the term based on session_id and term_name
  const session = await Session.findByPk(session_id);

  if (!session) {
    throw NotFoundError(`No session with id ${session_id}`);
  }

  const newTerm = await Term.create({
    session_id,
    term_name,
    start_date,
    end_date,
    next_term_date,
  });

  // Send a success response with the created term
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Term created successfully",
    term: newTerm,
  });
};

const getAllTermSchema = yup.object().shape({
  status: yup.string().optional(),
  sort: yup
    .string()
    .optional()
    .oneOf(["latest", "oldest", "a-z", "z-a"], "Invalid sort value"),
  page: yup.number().integer().positive().optional(),
  limit: yup.number().integer().positive().optional(),
  // Add more validation rules for other query parameters as needed
});

const getAllTerm = async (req, res) => {
  await getAllTermSchema.validate(req.query);

  const { sort } = req.query;

  const queryObject = {};

  let terms = await Term.findAll({
    where: queryObject,
    include: [{ model: Session, attributes: ["session_id", "session_name"] }],
    order: [],
    offset: 0,
    limit: 10,
  });

  // Apply sorting based on the 'sort' query parameter
  if (sort === "latest") {
    terms = terms.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sort === "oldest") {
    terms = terms.sort((a, b) => a.createdAt - b.createdAt);
  } else if (sort === "a-z") {
    terms = terms.sort((a, b) => a.term_name.localeCompare(b.term_name));
  } else if (sort === "z-a") {
    terms = terms.sort((a, b) => b.term_name.localeCompare(a.term_name));
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Apply pagination
  terms = terms.slice(offset, offset + limit);

  // Fetch the total count for pagination
  const totalTerms = await Term.count({ where: queryObject });
  const numOfPages = Math.ceil(totalTerms / limit);

  res.status(StatusCodes.OK).json({ terms, totalTerms, numOfPages });
};

const showCalendar = async (req, res) => {
  const allTerms = await Term.findAll({
    include: Session,
  });

  if (!allTerms || allTerms.length === 0) {
  }

  // Group terms by session_id
  const termsBySession = groupTermsBySession(allTerms);

  // Calculate total weeks and breaks for each session using map
  const school_calendar = await Promise.all(
    Object.entries(termsBySession).map(async ([session_id, terms]) => {
      // Fetch session name using session_id
      const session = await Session.findByPk(session_id);
      const sessionInfo = calculateSessionInfo(session, terms);
      const sessionTotals = calculateSessionTotals(sessionInfo);
      return { ...sessionInfo, ...sessionTotals };
    })
  );

  res.status(StatusCodes.OK).json({ school_calendar });
};

// Function to calculate session information
const calculateSessionInfo = (session, terms) => {
  // Sort terms based on createdAt
    const sortedTerms = terms.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  // Calculate session information based on sorted terms
  const sessionInfo = {
    session_id: session.session_id,
    session_name: session.session_name,
    terms: sortedTerms.map((term) => {
      const { term_name, start_date, end_date, next_term_date } = term;
      return {
        term_name,
        start_date,
        end_date,
        next_term_date,
        breaks: calculateBreaks(end_date, next_term_date),
        total_weeks: calculateTotalWeeks(start_date, end_date),
      };
    }),
  };

  return sessionInfo;
};

// Function to calculate breaks
const calculateBreaks = (endDate, nextTermDate) => {
  const end = moment(endDate);
  const nextTermStart = moment(nextTermDate);

  // Calculate the difference in weeks between end and next term start
  const breaks = nextTermStart.diff(end, "weeks");

  return breaks;
};

// Function to calculate total weeks
const calculateTotalWeeks = (startDate, endDate) => {
  const start = moment(startDate);
  const end = moment(endDate);

  // Calculate the difference in weeks between start and end dates
  const totalWeeks = end.diff(start, "weeks");

  return totalWeeks;
};

// Function to calculate session totals
const calculateSessionTotals = (sessionInfo) => {
  const sessionTotalWeeks = sessionInfo.terms.reduce(
    (acc, term) => acc + term.total_weeks,
    0
  );
  const sessionTotalBreaks = sessionInfo.terms.reduce(
    (acc, term) => acc + term.breaks,
    0
  );

  return {
    session_total_weeks: sessionTotalWeeks,
    session_total_breaks: sessionTotalBreaks,
  };
};

// Function to group terms by session_id
const groupTermsBySession = (terms) => {
  return terms.reduce((acc, term) => {
    const session_id = term.session_id;
    if (!acc[session_id]) {
      acc[session_id] = [];
    }
    acc[session_id].push(term);
    return acc;
  }, {});
};

const getTerm = async (req, res) => {
  const { term_id } = req.params;
  // Find the term by its primary key (term_id)
  const term = await Term.findByPk(term_id);

  if (!term) {
    throw NotFoundError(`No term with id ${term_id}`);
  }

  res.status(StatusCodes.OK).json({ term });
};

const updateTerm = async (req, res) => {
  const { term_id } = req.params;

  const { term_name, start_date, end_date, next_term_date } = req.body;

  const term = await Term.findByPk(term_id);

  if (!term) {
    throw NotFoundError(`No term with id ${term_id}`);
  }

  // Update term details
  term.term_name = term_name || term.term_name;
  term.start_date = start_date || term.start_date;
  term.end_date = end_date || term.end_date;
  term.next_term_date = next_term_date || term.next_term_date;

  // Save the updated term
  await term.save();
  res.status(StatusCodes.OK).send();
};
const deleteTerm = async (req, res) => {
  const { term_id } = req.params;
  // Find the term by its primary key (term_id)
  const term = await Term.findByPk(term_id);

  if (!term) {
    throw NotFoundError(`No term with id ${term_id}`);
  }
  // Delete the term
  await term.destroy();

  res.status(StatusCodes.OK).send();
};

module.exports = {
  createTerm,
  getAllTerm,
  getTerm,
  updateTerm,
  deleteTerm,
  showCalendar,
};
