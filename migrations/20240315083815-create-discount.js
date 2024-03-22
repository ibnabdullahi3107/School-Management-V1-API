"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Discounts", {
      discount_id: {
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
      session_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "Sessions",
          key: "session_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      term_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "Terms",
          key: "term_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      payment_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "PaymentTypes",
          key: "payment_type_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      discount_amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    // Add unique constraint
    await queryInterface.addConstraint("Discounts", {
      type: "unique",
      fields: ["student_id", "session_id", "term_id"],
      name: "unique_discount_per_student_session_term",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Discounts");
  },
};
