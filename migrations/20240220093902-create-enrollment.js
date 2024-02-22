"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Enrollments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Students",
          key: "id",
        },
      },
      class_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "Class",
          key: "class_id",
        },
      },
      term_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Terms",
          key: "term_id",
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
    // Add constraints and validations
    await queryInterface.addConstraint("Enrollments", {
      fields: ["student_id", "class_id", "term_id"],
      type: "unique",
      name: "unique_enrollment",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Enrollments");
  },
};
