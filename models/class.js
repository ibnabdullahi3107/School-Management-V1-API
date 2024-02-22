"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    static associate(models) {
      // define association here
    }
  }

  Class.init(
    {
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      class_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 20],
        },
      },
    },
    {
      sequelize,
      modelName: "Class",
      tableName: "Class",
      timestamps: true,
    }
  );
  return Class;
};
