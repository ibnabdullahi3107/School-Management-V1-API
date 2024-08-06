"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TransactionHistories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      account_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Accounts",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
      },
      transaction_type: {
        type: Sequelize.ENUM("Income", "Expense"),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.STRING,
      },
      receipt_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Receipts",
          key: "id",
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
      discount_applied_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Discounts",
          key: "discount_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      related_entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Students",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      transaction_status: {
        type: Sequelize.ENUM("Pending", "Completed", "Canceled"),
        allowNull: false,
        defaultValue: "Pending",
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("TransactionHistories");
  },
};
