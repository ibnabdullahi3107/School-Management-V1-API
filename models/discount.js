"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Discount extends Model {
    static associate(models) {
      Discount.belongsTo(models.Student, {
        foreignKey: "student_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Discount.belongsTo(models.Session, {
        foreignKey: "session_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Discount.belongsTo(models.Term, {
        foreignKey: "term_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Discount.belongsTo(models.PaymentType, {
        foreignKey: "payment_type_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  Discount.init(
    {
      discount_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      student_id: {
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
      payment_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
          isInt: true,
        },
      },
      discount_amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        validate: {
          notNull: true,
          isDecimal: true,
          min: 0,
        },
      },
    },
    {
      sequelize,
      modelName: "Discount",
      timestamps: true,
    }
  );

  return Discount;
};
