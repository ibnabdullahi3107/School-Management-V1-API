const {
  Student,
  Enrollment,
  Class,
  Term,
  Session,
  Payment,
  PaymentType,
  OutstandingBalance,
  Discount,
  Receipt,
} = require("../../models");

const getReceiptData = async (receipt) => {
  // Fetch additional information related to the receipt
  const payment = await Payment.findByPk(receipt.payment_id);
  const paymentType = await PaymentType.findByPk(payment.payment_type_id);
  const student = await Student.findByPk(receipt.student_id);
  const session = await Session.findByPk(payment.session_id);
  const term = await Term.findByPk(payment.term_id);
  const discount = receipt.discount_id
    ? await Discount.findByPk(receipt.discount_id)
    : null;
  const outstandingBalance = receipt.outstanding_id
    ? await OutstandingBalance.findOne({
        where: {
          id: receipt.outstanding_id,
          payment_type_id: payment.payment_type_id,
        },
      })
    : null;
  const enrollment = await Enrollment.findByPk(receipt.class_id);
  const classObj = await Class.findByPk(enrollment.class_id);

  // Construct the receipt data object with the fetched information
  const receiptData = {
    receipt_number: receipt.receipt_number,
    amount_paid: receipt.amount_paid,
    student: {
      reg_number: student.reg_number,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender,
      next_of_kin_name: student.next_of_kin_name,
      next_of_kin_phone_number: student.next_of_kin_phone_number,
    },
    payment: {
      payment_type: paymentType ? paymentType.payment_type_name : null,
      amount: payment.amount,
      amount_type: payment.amount_type,
      payment_date: payment.payment_date,
      session: session ? session.session_name : null,
      term: term
        ? {
            term_name: term.term_name,
            start_date: term.start_date,
            end_date: term.end_date,
          }
        : null,
    },
    discount:
      discount && discount.payment_type_id === payment.payment_type_id
        ? {
            session: discount.session_id,
            term: discount.term_id,
            payment_type: paymentType ? paymentType.payment_type_name : null,
            discount_amount: discount.discount_amount,
          }
        : null,
    outstanding_balance: outstandingBalance
      ? {
          session: outstandingBalance.session_id,
          term: outstandingBalance.term_id,
          payment_type: paymentType ? paymentType.payment_type_name : null,
          amount: outstandingBalance.amount,
        }
      : null,
    class: {
      class_name: classObj ? classObj.class_name : null,
      session: session ? session.session_name : null,
      term: term
        ? {
            term_name: term.term_name,
            start_date: term.start_date,
            end_date: term.end_date,
          }
        : null,
    },
  };

  return receiptData;
};

module.exports = {
  getReceiptData,
};
