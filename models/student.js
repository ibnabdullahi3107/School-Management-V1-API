"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate(models) {
      // Define associations
      Student.belongsTo(models.Class, {
        foreignKey: "class_id",
        allowNull: false,
      });
      Student.belongsTo(models.Term, {
        foreignKey: "term_id",
        allowNull: false,
      });
      Student.belongsTo(models.Session, {
        foreignKey: "session_id",
        allowNull: false,
      });
      // Student.belongsTo(models.SchoolFee, {
      //   foreignKey: "school_fee_id",
      //   allowNull: false,
      // });
    }
  }
  Student.init(
    {
      registration_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
      },
      date_of_birth: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: true,
          isDate: true,
        },
      },
      class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Class",
          key: "id",
        },
      },
      term_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Term",
          key: "id",
        },
      },
      session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Session",
          key: "id",
        },
      },
      // school_fee_id: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      //   references: {
      //     model: "SchoolFee",
      //     key: "id",
      //   },
      // },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
      },
      lga: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
      },
      next_of_kin_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
      },
      next_of_kin_phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
          isNumeric: true,
        },
      },
      next_of_kin_address: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
      },
      next_of_kin_relation: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
      },
    },
    {
      sequelize,
      modelName: "Student",
    }
  );
  return Student;
};
