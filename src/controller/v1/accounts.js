const bcrypt = require("bcrypt");
const DATABASE = require("../../utils/DATABASE/v1/DATABASE");
const LOGGER = require("../../utils/LOGGER/v1/logger");
const SYSTEM = require("./system");

class AccountController extends LOGGER {
  static QUERIES = {
    CREATE: `INSERT INTO users (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    READ: `SELECT * FROM users WHERE user_id = $1`,
    UPDATE: `UPDATE users SET first_name = $1,  middle_name = $2, last_name = $3, email = $4,  phone = $5,  gender = $6,  dob = $7, country_code = $8, state_code = $9,  city_name = $10,  role_id = $11, is_allowed = $12 WHERE user_id = $13 RETURNING *`,
    DELETE: `DELETE FROM users WHERE user_id = $1`,
    UPDATE_PASSWORD: `UPDATE users SET password = $1 WHERE user_id = $2`,
    READ_USER_ID: `SELECT user_id FROM users WHERE user_id = $1`,
    USER_AUDIT: `INSERT INTO userh (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password, actions) SELECT user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password, $1 FROM users WHERE user_id = $2 RETURNING *`,
  };

  constructor(LOG_FILE_NAME = "/Controllers/AccountController.log") {
    super(LOG_FILE_NAME);
    this.DB = DATABASE.CONNECTION;
  }
  createAccount = (accountInfo) => {
    return account;
  };
  readAccount = (accountInfo) => {
    return account;
  };
  updateAccount = (accountInfo) => {
    return updatedAccount;
  };
  deleteAccount = (accountInfo) => {
    return account;
  };
  addAccountApi = (req, res) => {};
  updateAccountApi = (req, res) => {};
}

module.exports = AccountController;
