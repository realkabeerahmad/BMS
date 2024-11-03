const LOGGER = require("../../logger/v1/logger");
const dotenv = require("dotenv");
const pgp = require("pg-promise")();

dotenv.config();

class DATABASE extends LOGGER {
  constructor(LOGS_FILE_PATH) {
    super(LOGS_FILE_PATH, LOGGER.LEVEL.DEBUG);
    this.INFO("ACCQUIRING DATABASE CONNECTION");
    this.DEBUG("PG_USER: " + process.env.PG_USER);
    this.DEBUG("PG_PASSWORD: " + process.env.PG_PASSWORD);
    this.DEBUG("PG_HOST: " + process.env.PG_HOST);
    this.DEBUG("PG_POR: " + process.env.PG_POR);
    this.DEBUG("PG_DATABASE: " + process.env.PG_DATABASE);
    this.CONNECTION = pgp({
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      host: process.env.PG_HOST,
      port: process.env.PG_POR,
      database: process.env.PG_DATABASE,
    });
    this.INFO("DATABASE CONNECTION ACCQUIRED SUCCESSFULLY");
  }
}

module.exports = DATABASE;
