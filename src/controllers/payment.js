const { StatusCodes } = require("http-status-codes");
// const moment = require("moment");
const {
  Payment,
  Student,
  Class,
  Session,
  Term,
  Enrollment,
  PaymentType,
  OutstandingBalance,
} = require("../../models");
const { Op } = require("sequelize");

const {
  applySortingAndPagination,
  getSortingOrder,
} = require("../services/sortdata");

const { BadRequestError, NotFoundError } = require("../errors");

const create_Process_Payment = async (req, res) => {
  const { student_id, payment_type_id, amount, amount_type } = req.body;

  // Check if the student exists
  const student = await Student.findByPk(student_id);
  if (!student) {
    throw new NotFoundError(`No student found with ID number ${student_id}.`);
  }

  // Check if payment type exists
  const paymentType = await PaymentType.findByPk(payment_type_id);
  if (!paymentType) {
    throw new NotFoundError(
      `Payment type with id ${payment_type_id} not found.`
    );
  }

  // Query the Payment table to retrieve the last payment made by the student
  const lastPayment = await Payment.findOne({
    where: { student_id },
    order: [["payment_date", "DESC"]],
  });

  // If there's no last payment, return an error
  if (!lastPayment) {
    throw new BadRequestError(
      "No previous payments available to determine session and term."
    );
  }

  // Determine session_id and term_id
  const { session_id, term_id } = await determineSessionAndTerm(
    student_id,
    lastPayment
  );

  // Handle outstanding balances and get the remaining amount
  let remainingAmount = amount;
  if (lastPayment && lastPayment.payment_type_id === payment_type_id) {
    remainingAmount = await handleOutstandingBalances(
      student_id,
      payment_type_id,
      amount,
      lastPayment.session_id,
      lastPayment.term_id
    );
  }

  const paymentTypeAmount = paymentType.amount;

  // If there's a remaining amount after deducting outstanding balances
  if (remainingAmount > 0) {
    // Check if the remaining amount is sufficient to pay for another term
    if (remainingAmount >= paymentTypeAmount) {
      // Pay for the current term
      await Payment.create({
        student_id,
        payment_type_id,
        amount: paymentTypeAmount,
        amount_type,
        session_id,
        term_id,
      });
    } else {
      // Pay for the remaining amount in another term and move the rest to outstanding
      const remainingTermAmount = paymentTypeAmount - remainingAmount;
      await Payment.create({
        student_id,
        payment_type_id,
        amount: remainingAmount,
        amount_type,
        session_id,
        term_id,
      });
      // Move the rest amount to outstanding balances
      await OutstandingBalance.create({
        student_id,
        payment_type_id,
        amount: remainingTermAmount,
        session_id,
        term_id,
      });
    }
  }

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Payment created successfully",
    payment: {
      student_id,
      payment_type_id,
      amount,
      amount_type,
    },
  });
};

const handleOutstandingBalances = async (
  student_id,
  payment_type_id,
  amount,
  session_id,
  term_id
) => {
  let remainingAmount = amount;
  let totalDeducted = 0;

  // Retrieve outstanding balances for the same payment type
  const outstandingBalances = await OutstandingBalance.findAll({
    where: {
      student_id,
      payment_type_id,
    },
  });

  // Deduct outstanding balances from the amount
  for (const balance of outstandingBalances) {
    const balanceAmount = balance.amount;
    if (balanceAmount <= remainingAmount) {
      // Fully paid outstanding balance
      await balance.destroy();
      totalDeducted += balanceAmount;
      remainingAmount -= balanceAmount;
    } else {
      // Partially paid outstanding balance
      await balance.decrement("amount", { by: remainingAmount });
      totalDeducted += remainingAmount;
      remainingAmount = 0;
    }

    if (remainingAmount === 0) {
      // Break out of the loop if the full amount has been deducted
      break;
    }
  }

  // Update payment ID of the payment amount to be the actual amount
  const paymentToUpdate = await Payment.findOne({
    where: {
      student_id,
      payment_type_id,
      session_id,
      term_id,
    },
  });

  if (paymentToUpdate) {
    // Parse the amount from string to number
    const currentAmount = parseFloat(paymentToUpdate.amount);
    const deductedAmount = parseFloat(totalDeducted);
    const updatedAmount = currentAmount + deductedAmount;

    // Update the payment amount
    await paymentToUpdate.update({ amount: updatedAmount });
  }

  // Return the remaining amount
  return remainingAmount;
};

// const updateTermStatus = async (session_id, term_id, student_id) => {
//   const term = await Term.findOne({ where: { session_id, term_id } });
//   if (!term) {
//     throw new NotFoundError(
//       `Term with session ID ${session_id} and term ID ${term_id} not found.`
//     );
//   }

//   const enrollments = await Enrollment.findAll({
//     where: { session_id, term_id, student_id },
//   });
//   if (!enrollments || enrollments.length === 0) {
//     throw new NotFoundError(
//       `No enrollment found for student ${student_id} in term ${term_id} of session ${session_id}.`
//     );
//   }

//   // Check if all enrollments are paid
//   const allEnrollmentsPaid = enrollments.every(
//     (enrollment) => enrollment.is_paid
//   );

//   if (allEnrollmentsPaid) {
//     // Update term status to completed
//     await term.update({ is_completed: true });
//   }
// };

// Function to determine session_id and term_id
const determineSessionAndTerm = async (student_id, lastPayment) => {
  // Retrieve the session_id and term_id of the last payment
  const { session_id: lastSessionID, term_id: lastTermID } = lastPayment;

  // Check for the next term within the current session
  const nextTerm = await Term.findOne({
    where: {
      session_id: lastSessionID,
      term_id: { [Op.gt]: lastTermID },
    },
    order: [["term_id", "ASC"]],
  });

  // If there's a next term within the current session, return its session_id and term_id
  if (nextTerm) {
    return { session_id: lastSessionID, term_id: nextTerm.term_id };
  }

  // If there's no next term within the current session, check for the next session
  const nextSession = await Session.findOne({
    where: { session_id: { [Op.gt]: lastSessionID } },
    order: [["session_id", "ASC"]],
  });

  // If there's a next session, use the first term of the next session
  if (nextSession) {
    const firstTermOfNextSession = await Term.findOne({
      where: { session_id: nextSession.session_id },
      order: [["term_id", "ASC"]],
    });

    // If there's a first term for the next session, return its session_id and term_id
    if (firstTermOfNextSession) {
      return {
        session_id: nextSession.session_id,
        term_id: firstTermOfNextSession.term_id,
      };
    }
  }

  // If no more sessions are available for payment, throw an error
  throw new BadRequestError("No more sessions available for payment.");
};

async function getPaymentTypeName(paymentTypeId) {
  try {
    const paymentType = await PaymentType.findByPk(paymentTypeId);
    return paymentType ? paymentType.payment_type_name : null;
  } catch (error) {
    // Handle errors appropriately
    console.error("Error while retrieving payment type name:", error);
    return null;
  }
}

const getAll_Process_Payment = async (req, res) => {
  const {
    term_id,
    session_id,
    payment_type_id,
    amount_type,
    reg_number,
    last_name,
    search,
  } = req.query;

  // Construct the filter object based on the provided query parameters
  const filter = {};
  if (term_id) filter.term_id = term_id;
  if (session_id) filter.session_id = session_id;
  if (payment_type_id) filter.payment_type_id = payment_type_id;
  if (amount_type) filter.amount_type = amount_type;

  // Include filtering based on student attributes
  const studentFilter = {};
  if (reg_number) studentFilter.reg_number = reg_number;
  if (last_name) studentFilter.last_name = last_name;

  // Include text search
  const searchTextFilter = {};
  if (search) {
    searchTextFilter[Op.or] = [
      { "$Student.reg_number$": { [Op.like]: `%${search}%` } },
      { "$Student.first_name$": { [Op.like]: `%${search}%` } },
      { "$Student.last_name$": { [Op.like]: `%${search}%` } },
      // Add other columns you want to include in the search
    ];
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  // Find payments based on the filter object
  const { count, rows } = await Payment.findAndCountAll({
    where: filter,
    include: [
      {
        model: Student,
        attributes: [
          "id",
          "reg_number",
          "first_name",
          "last_name",
          "date_of_birth",
          "gender",
          "address",
          "local_government_area",
          "next_of_kin_name",
          "next_of_kin_phone_number",
          "next_of_kin_address",
          "next_of_kin_relation",
        ],
        where: { ...studentFilter, ...searchTextFilter }, // Apply student filtering and text search
      },
      {
        model: PaymentType,
        attributes: ["payment_type_id", "payment_type_name"],
      },
      { model: Session, attributes: ["session_id", "session_name"] },
      { model: Term, attributes: ["term_id", "term_name"] },
    ],
    offset,
    limit,
  });

  if (!rows || rows.length === 0) {
    throw new NotFoundError("No payments found.");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Payments retrieved successfully",
    payments: rows,
    pagination: {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  });
};

const get_Process_Payment = async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findByPk(id, {
    include: [
      {
        model: Student,
        attributes: [
          "id",
          "reg_number",
          "first_name",
          "last_name",
          "date_of_birth",
          "gender",
          "address",
          "local_government_area",
          "next_of_kin_name",
          "next_of_kin_phone_number",
          "next_of_kin_address",
          "next_of_kin_relation",
        ],
      },
      {
        model: PaymentType,
        attributes: ["payment_type_id", "payment_type_name"],
      },
      { model: Session, attributes: ["session_id", "session_name"] },
      { model: Term, attributes: ["term_id", "term_name"] },
    ],
  });

  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Payment not found",
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Payment retrieved successfully",
    payment: payment,
  });
};

const update_Process_Payment = async (req, res) => {
  const {
    params: { id },
    body: updateFields,
  } = req;

  // Check if the payment exists
  let payment = await Payment.findByPk(id);
  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Payment not found",
    });
  }

  // Update the payment details
  for (const key in updateFields) {
    if (Object.hasOwnProperty.call(updateFields, key)) {
      payment[key] = updateFields[key];
    }
  }

  // Save the updated payment
  await payment.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Payment updated successfully",
    payment: payment,
  });
};

const delete_Process_Payment = async (req, res) => {
  const { id } = req.params;

  // Check if the payment exists
  const payment = await Payment.findByPk(id);
  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Payment not found",
    });
  }

  // Delete the payment
  await payment.destroy();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Payment deleted successfully",
  });
};

module.exports = {
  create_Process_Payment,
  getAll_Process_Payment,
  get_Process_Payment,
  update_Process_Payment,
  delete_Process_Payment,
};
