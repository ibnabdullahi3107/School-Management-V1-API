const { Sequelize } = require("sequelize");
const config = require("./config");

const sequelize = new Sequelize(config.development);

const dbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      "Connection to the database has been established successfully."
    );
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1); // Terminate the process if unable to connect
  }
};

module.exports = {
  sequelize,
  dbConnection,
};
