const { PaymentTypeAccount, sequelize } = require("../../models");
const { NotFoundError, BadRequestError } = require("../errors");

const updateAccountBalance = async (paymentTypeId, amount) => {
  let transaction;
  try {
    // Start a transaction
    transaction = await sequelize.transaction();

    // Find the associated account for the payment type
    const paymentTypeAccount = await PaymentTypeAccount.findOne({
      where: { payment_type_id: paymentTypeId },
      include: { all: true },
      transaction,
    });

    if (!paymentTypeAccount) {
      throw new NotFoundError(
        `Payment type account not found for payment type ID: ${paymentTypeId}`
      );
    }

    const account = paymentTypeAccount.Account;

    // Parse the amount as a float (assuming it's stored as a string)
    const parsedAmount = parseFloat(amount);

    // Validate the parsed amount
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new BadRequestError("Invalid or non-positive amount");
    }

    // Calculate the updated balance
    const oldBalance = parseFloat(account.balance);
    const updatedBalance = oldBalance + parsedAmount;

    // Update the account balance within the transaction
    await account.update({ balance: updatedBalance }, { transaction });

    // Commit the transaction
    await transaction.commit();

    // Return the updated account balance for logging or further processing
    return updatedBalance;
  } catch (error) {
    // Rollback the transaction if an error occurs
    if (transaction) {
      await transaction.rollback();
    }

    console.error(
      `Error updating account balance for payment type ID ${paymentTypeId}:`,
      error
    );
    throw new Error(
      `Failed to update account balance for payment type ID ${paymentTypeId}`
    );
  }
};

module.exports = {
  updateAccountBalance,
};
