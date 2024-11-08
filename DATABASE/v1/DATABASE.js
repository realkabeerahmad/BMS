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
  // errorHandler.js

  static handleDatabaseError(error) {
    switch (error.code) {
      case "23505": // PostgreSQL unique constraint violation (duplicate key)
        return {
          serverResponseCode: 400,
          responseDescription: "already exists with the provided ID or email",
        };

      case "23503": // Foreign key violation (referential integrity)
        return {
          serverResponseCode: 400,
          responseDescription: "Referenced foreign key does not exist",
        };

      case "23514": // Check constraint violation (e.g., invalid data format)
        return {
          serverResponseCode: 400,
          responseDescription:
            "Invalid data provided according to database constraints",
        };

      case "42P01": // Undefined table error (e.g., table does not exist)
        return {
          serverResponseCode: 500,
          responseDescription:
            "Internal Server Error: Database table not found",
        };

      case "08003": // Connection does not exist (usually for PostgreSQL)
        return {
          serverResponseCode: 500,
          responseDescription: "Database connection error",
        };

      default:
        // Default error response for unhandled error codes
        return {
          serverResponseCode: 500,
          responseDescription: "Internal Server Error: Something went wrong",
        };
    }
  }
}

module.exports = DATABASE;
