"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PaymentTypeAccount extends Model {
    static associate(models) {
      // Define association with PaymentType model
      PaymentTypeAccount.belongsTo(models.PaymentType, {
        foreignKey: "payment_type_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      // Define association with Account model
      PaymentTypeAccount.belongsTo(models.Accounts, {
        foreignKey: "account_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  PaymentTypeAccount.init(
    {
      payment_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
          isInt: true,
        },
      },
      account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
          isInt: true,
        },
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
      modelName: "PaymentTypeAccount",
      timestamps: true,
    }
  );

  return PaymentTypeAccount;
};
