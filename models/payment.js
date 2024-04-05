"use strict";
const { Model, DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Student, {
        foreignKey: "student_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Payment.belongsTo(models.PaymentType, {
        foreignKey: "payment_type_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Payment.belongsTo(models.Session, {
        foreignKey: "session_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Payment.belongsTo(models.Term, {
        foreignKey: "term_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  Payment.init(
    {
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
          isInt: true,
        },
      },
      payment_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
          isInt: true,
        },
      },
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
          isInt: true,
        },
      },
      term_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
          isInt: true,
        },
      },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        validate: {
          notNull: true,
          isDecimal: true,
          // min: 0,
        },
      },
      amount_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
          notNull: true,
          isDate: true,
        },
      },
      regular_payment: { 
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: "Payment",
      timestamps: true,
    }
  );

  return Payment;
};
