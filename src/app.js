const express = require("express");
require("express-async-errors");
const { dbConnection } = require("../config/db");

// extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares authenthications

// routers
const sessionsRouter = require("./routes/sessions");
const termsRouter = require("./routes/terms");
const calenderRouter = require("./routes/calendar");
const classesRouter = require("./routes/classes");
const schoolFeesRouter = require("./routes/schoolFee");
const studentsRouter = require("./routes/students");
const feeStructureRouter = require("./routes/feeStructure");
const studentFeeAssignmentRouter = require("./routes/studentFeeAssignmen");


// errors handlers
const notFoundMiddleware = require("./middlewares/not-found");
const errorHandlerMiddleware = require("./middlewares/error-handler");

app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// routes
// app.use('/api/v1/auth', authRouter);
// app.use('/api/v1/sessions', authenticateUser, jobsRouter);

app.use("/api/v1/sessions", sessionsRouter);
app.use("/api/v1/terms", termsRouter);
app.use("/api/v1/calenders", calenderRouter);
app.use("/api/v1/classes", classesRouter);
app.use("/api/v1/school-fees", schoolFeesRouter);
app.use("/api/v1/students", studentsRouter);
app.use("/api/v1/fee-structures", feeStructureRouter);
app.use("/api/v1/student-fee-assignments", studentFeeAssignmentRouter);




app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const startServer = async () => {
  try {
    //  database connection
    await dbConnection();

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

// Call the function to start the server
startServer();
