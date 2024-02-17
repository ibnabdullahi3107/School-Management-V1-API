"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    static associate(models) {
      Class.belongsTo(models.Session, { foreignKey: "session_id" });
      Class.belongsTo(models.Term, { foreignKey: "term_id" });
    }
  }

  Class.init(
    {
      class_name: DataTypes.STRING,
      session_id: DataTypes.INTEGER,
      term_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Class",
    }
  );

  return Class;
};
