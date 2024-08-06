const {
  Payment,
  OutstandingBalance,
  Receipt,
  Enrollment,
  sequelize,
} = require("../../models");

const handleOutstandingBalances = async (
  student_id,
  payment_type_id,
  amount,
) => {
  let transaction;

  try {
    let collectedAmount = amount;
    let deductedAmount = 0;

    // Begin database transaction
    transaction = await sequelize.transaction();

    // Retrieve outstanding balances for the same payment type
    const outstandingBalance = await OutstandingBalance.findOne({
      where: {
        student_id,
        payment_type_id,
      },
      transaction, // Pass transaction to query
    });

    // If outstanding balance exists, handle it
    if (outstandingBalance) {
      const outstandingAmount = outstandingBalance.amount;

      // Check if collectedAmount covers the outstandingAmount fully
      if (collectedAmount >= outstandingAmount) {
        deductedAmount = outstandingAmount; // Deduct outstandingAmount from collectedAmount
        collectedAmount -= deductedAmount; // Update remaining collectedAmount
        await outstandingBalance.destroy({ transaction });
      } else {
        deductedAmount = collectedAmount; // Deduct collectedAmount
        collectedAmount = 0; // No remaining amount after deduction
        await outstandingBalance.decrement("amount", {
          by: deductedAmount,
          transaction,
        });
      }

      // Commit the transaction
      await transaction.commit();

      return {
        deductedAmount,
        remainingAmount: collectedAmount,
      };
    } else {
      // Commit the transaction
      await transaction.commit();

      // No outstanding balance found, return the collected amount
      return {
        deductedAmount: 0,
        remainingAmount: collectedAmount,
      };
    }
  } catch (error) {
    // Rollback the transaction in case of any error
    if (transaction) {
      await transaction.rollback();
    }
    throw error; // Rethrow the error for higher-level handling
  }
};

module.exports = {
  handleOutstandingBalances,
};
