"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Transaction extends Model {
    static associate(models) {
      // Define associations
      Transaction.belongsTo(models.Receipt, {
        foreignKey: "receipt_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Transaction.belongsTo(models.PaymentType, {
        foreignKey: "payment_type_id",
        onDelete: "CASCADE",
      });
      Transaction.belongsTo(models.Discount, {
        foreignKey: "discount_applied_id",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
      Transaction.belongsTo(models.Student, {
        foreignKey: "related_entity_id",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  }

  Transaction.init(
    {
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      description: {
        type: DataTypes.STRING,
      },
      transaction_type: {
        type: DataTypes.ENUM("Income", "Expense"),
        allowNull: false,
      },
      transaction_status: {
        type: DataTypes.ENUM("Pending", "Completed", "Canceled"),
        allowNull: false,
        defaultValue: "Pending",
      },
      payment_method: {
        type: DataTypes.STRING,
      },
      receipt_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: true,
        },
      },
      payment_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: true,
        },
      },
      discount_applied_id: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: true,
        },
      },
      related_entity_id: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: true,
        },
      },
    },
    {
      sequelize,
      modelName: "Transaction",
    }
  );

  return Transaction;
};
