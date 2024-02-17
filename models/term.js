"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Term extends Model {
    static associate(models) {
      // Define association with Session model
      Term.belongsTo(models.Session, {
        foreignKey: "session_id",
        onDelete: "CASCADE", 
        onUpdate: "CASCADE", 
      });
    }
  }
  Term.init(
    {
      term_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Sessions",
          key: "id",
        },
      },
      term_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      next_term_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Term",
    }
  );
  return Term;
};
