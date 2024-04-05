const {
  Payment,
  OutstandingBalance,
  Receipt,
  Enrollment,
} = require("../../models");
const { generateReceiptNumber } = require("../services/generateReceiptNumber");

const handleOutstandingBalances = async (
  student_id,
  payment_type_id,
  amount,
  session_id,
  term_id,
  amount_type
) => {
  let remainingAmount = amount;
  let newPayment;
  let newPaymentReceipt;

  // Retrieve outstanding balances for the same payment type
  const outstandingBalances = await OutstandingBalance.findAll({
    where: {
      student_id,
      payment_type_id,
    },
  });

  const enrollmentStudent = await Enrollment.findByPk(student_id);
  const receiptNumber = await generateReceiptNumber();

  for (const outstandingBalance  of outstandingBalances) {
    const balanceAmount = outstandingBalance.amount;

    if (balanceAmount <= remainingAmount) {
      remainingAmount -= balanceAmount;
      await outstandingBalance.destroy();
    } else {
      await outstandingBalance.decrement("amount", { by: remainingAmount });
      remainingAmount = 0;
    }

    const payment = await Payment.create({
      student_id,
      payment_type_id,
      amount: balanceAmount,
      session_id,
      term_id,
      amount_type,
      regular_payment: false,
    });

    const paymentReceipt = await Receipt.create({
      receipt_number: receiptNumber,
      student_id,
      payment_id: payment.id,
      discount_id: null,
      outstanding_id: outstandingBalance ? outstandingBalance.id : null,
      class_id: enrollmentStudent.id,
      amount_paid: balanceAmount,
    });

    if (remainingAmount === 0) {
      return remainingAmount;
    }
  }

  if (remainingAmount > 0) {
    newPayment = await Payment.create({
      student_id,
      payment_type_id,
      amount: remainingAmount,
      session_id,
      term_id,
      amount_type,
      regular_payment: true,
    });

    newPaymentReceipt = await Receipt.create({
      receipt_number: receiptNumber,
      student_id,
      payment_id: newPayment.id,
      discount_id: null,
      outstanding_id: null,
      class_id: enrollmentStudent.id,
      amount_paid: remainingAmount,
    });
  }

  return remainingAmount;
};

module.exports = {
  handleOutstandingBalances,
};
