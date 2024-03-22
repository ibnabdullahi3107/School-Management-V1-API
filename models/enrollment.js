// enrollment.model.js

"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    static associate(models) {
      Enrollment.belongsTo(models.Student, {
        foreignKey: "student_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Enrollment.belongsTo(models.Class, {
        foreignKey: "class_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Enrollment.belongsTo(models.Session, {
        foreignKey: "session_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Enrollment.belongsTo(models.Term, {
        foreignKey: "term_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  Enrollment.init(
    {
      student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: true,
          isInt: true,
        },
      },
      class_id: {
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Enrollment",
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ["student_id", "class_id", "session_id", "term_id"],
        },
      ],
    }
  );

  return Enrollment;
};
