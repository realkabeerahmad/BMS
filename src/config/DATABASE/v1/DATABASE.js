const LOGGER = require("../../LOGGER/v1/LOGGER");
const pgp = require("pg-promise")();

class DATABASE extends LOGGER {
  static CONNECTION = pgp({
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
  });

  static BEGIN = () => DATABASE.CONNECTION.query("BEGIN;");
  static COMMIT = () => DATABASE.CONNECTION.query("COMMIT;");
  static ROLLBACK = () => DATABASE.CONNECTION.query("ROLLBACK;");

  static handleDatabaseError(error) {
    const errorMap = {
      "23505": { code: 400, message: "already exists with the provided ID or email" },
      "23503": { code: 400, message: "Referenced foreign key does not exist" },
      "23514": { code: 400, message: "Invalid data provided according to database constraints" },
      "42P01": { code: 500, message: "Internal Server Error: Database table not found" },
      "08003": { code: 500, message: "Database connection error" },
    };

    const { code, message } = errorMap[error.code] || { code: 500, message: "Internal Server Error: Something went wrong" };
    return { serverResponseCode: code, responseDescription: message };
  }
}

module.exports = DATABASE;