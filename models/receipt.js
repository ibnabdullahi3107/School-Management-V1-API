// models/Receipt.js

"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Receipt extends Model {
    static associate(models) {
      // Define associations with other tables
      Receipt.belongsTo(models.Student, {
        foreignKey: "student_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Receipt.belongsTo(models.Payment, {
        foreignKey: "payment_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Receipt.belongsTo(models.Discount, {
        foreignKey: "discount_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      Receipt.belongsTo(models.OutstandingBalance, {
        foreignKey: "outstanding_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      Receipt.belongsTo(models.Enrollment, {
        foreignKey: "class_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }
  Receipt.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      receipt_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      payment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      discount_id: {
        type: DataTypes.INTEGER,
      },
      outstanding_id: {
        type: DataTypes.INTEGER,
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount_paid: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "Receipt",
      tableName: "Receipts",
    }
  );
  return Receipt;
};
