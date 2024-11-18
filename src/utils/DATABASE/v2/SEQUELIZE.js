const { Sequelize } = require("sequelize");
const LOGGER = require("../../LOGGER/v1/LOGGER");
const dotenv = require("dotenv");

dotenv.config();

const logging = new LOGGER(process.env.ROOT_LOG_FILE_NAME || "root.log");
// Create a Sequelize instance

const SEQUELIZE = new Sequelize(
  `postgres://postgres:@dmin1122@localhost:5432/postgres`,
  {
    dialect: "postgres",
    logging: (message) => logging.INFO(message), // Enables logging of SQL queries for debugging
  }
);

module.exports = SEQUELIZE;
