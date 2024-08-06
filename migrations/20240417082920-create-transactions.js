"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Transactions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      transaction_type: {
        type: Sequelize.ENUM("Income", "Expense"),
        allowNull: false,
      },
      transaction_status: {
        type: Sequelize.ENUM("Pending", "Completed", "Canceled"),
        allowNull: false,
        defaultValue: "Pending",
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
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
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Transactions");
  },
};
