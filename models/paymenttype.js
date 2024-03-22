"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PaymentType extends Model {
    static associate(models) {
      // Define associations if any
    }
  }
  PaymentType.init(
    {
      payment_type_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      payment_type_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PaymentType",
      timestamps: true,
    }
  );
  return PaymentType;
};
