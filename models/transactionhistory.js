"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class TransactionHistory extends Model {
    static associate(models) {
      TransactionHistory.belongsTo(models.Accounts, {
        foreignKey: "account_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        allowNull: false,
      });

      TransactionHistory.belongsTo(models.Receipt, {
        foreignKey: "receipt_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        allowNull: false,
      });

      TransactionHistory.belongsTo(models.PaymentType, {
        foreignKey: "payment_type_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        allowNull: false,
      });

      TransactionHistory.belongsTo(models.Discount, {
        foreignKey: "discount_applied_id",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });

      TransactionHistory.belongsTo(models.Student, {
        foreignKey: "related_entity_id",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  }

  TransactionHistory.init(
    {
      account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          notNull: true,
          min: 0,
        },
      },
      transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: true,
          isDate: true,
        },
      },
      description: DataTypes.STRING,
      transaction_type: {
        type: DataTypes.ENUM("Income", "Expense"),
        allowNull: false,
        validate: {
          notNull: true,
          isIn: [["Income", "Expense"]],
        },
      },
      payment_method: DataTypes.STRING,
      receipt_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
        },
      },
      payment_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
        },
      },
      discount_applied_id: DataTypes.INTEGER,
      related_entity_id: DataTypes.INTEGER,
      transaction_status: {
        type: DataTypes.ENUM("Pending", "Completed", "Canceled"),
        allowNull: false,
        defaultValue: "Pending",
        validate: {
          notNull: true,
          isIn: [["Pending", "Completed", "Canceled"]],
        },
      },
    },
    {
      sequelize,
      modelName: "TransactionHistory",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return TransactionHistory;
};
