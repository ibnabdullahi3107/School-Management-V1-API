"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    static associate(models) {
      // You can define associations with other models here if needed
      Session.hasMany(models.Term, { foreignKey: "session_id" });

    }
  }

  Session.init(
    {
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      session_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      tableName: "Sessions",
      modelName: "Session",
      timestamps: true, // Include automatic timestamps
    }
  );

  return Session;
};
