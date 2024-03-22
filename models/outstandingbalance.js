// models/outstandingbalance.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OutstandingBalance extends Model {
    static associate(models) {
      // Define associations
      OutstandingBalance.belongsTo(models.Student, {
        foreignKey: "student_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      OutstandingBalance.belongsTo(models.Term, {
        foreignKey: "term_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      OutstandingBalance.belongsTo(models.Session, {
        foreignKey: "session_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      OutstandingBalance.belongsTo(models.PaymentType, {
        foreignKey: "payment_type_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  OutstandingBalance.init(
    {
      student_id: {
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
      session_id: {
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
      amount: {
        type: DataTypes.NUMERIC,
        allowNull: false,
        validate: {
          notNull: true,
          isDecimal: true,
        },
      },
    },
    {
      sequelize,
      modelName: "OutstandingBalance",
      timestamps: true,
    }
  );
  return OutstandingBalance;
};
