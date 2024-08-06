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
const studentsRouter = require("./routes/students");
const enrollmentStudentRouter = require("./routes/enrollments");
const paymentTypeRouter = require("./routes/payment-type");
const payment = require("./routes/payment");
const discount = require("./routes/discount");
const account = require("./routes/account");
const paymentTypeAccount = require("./routes/linkAccount_Payment_type");
const paymentRecords = require("./routes/payment_record");
const receipt_records = require("./routes/receipt_record");
const transaction_records = require("./routes/transaction_record");





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

app.use("/api/v1/sessions", sessionsRouter);
app.use("/api/v1/terms", termsRouter);
app.use("/api/v1/calenders", calenderRouter);
app.use("/api/v1/classes", classesRouter);
app.use("/api/v1/students", studentsRouter);
app.use("/api/v1/enrollment-student", enrollmentStudentRouter);
app.use("/api/v1/payment-types", paymentTypeRouter);
app.use("/api/v1/payment", payment);
app.use("/api/v1/discount", discount);
app.use("/api/v1/account", account);
app.use("/api/v1/link_account", paymentTypeAccount);
app.use("/api/v1/payment_records", paymentRecords);
app.use("/api/v1/receipt_records", receipt_records);
app.use("/api/v1/transaction_records", transaction_records);









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
