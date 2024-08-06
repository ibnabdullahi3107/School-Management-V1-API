"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Accounts extends Model {
    static associate(models) {
      // Define associations here
    }
  }

  Accounts.init(
    {
      account_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [4, 100],
          notEmpty: true,
        },
      },
      account_status: {
        type: DataTypes.ENUM("Active", "Closed", "Frozen"),
        allowNull: false,
        defaultValue: "Active",
      },
      owner: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [4, 255],
          notEmpty: true,
        },
      },
      account_permissions: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [4, 255],
          notEmpty: true,
        },
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      notes: DataTypes.TEXT,
      minimum_balance: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
          min: 0,
        },
      },
    },
    {
      sequelize,
      modelName: "Accounts",
    }
  );

  return Accounts;
};
