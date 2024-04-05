"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Class",
          key: "class_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Sessions",
          key: "session_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      term_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Terms",
          key: "term_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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

    // Add a unique constraint for the combination of keys
    await queryInterface.addConstraint("Enrollments", {
      fields: ["student_id", "class_id", "session_id", "term_id"],
      type: "unique",
      name: "unique_enrollment",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Enrollments");
  },
};
