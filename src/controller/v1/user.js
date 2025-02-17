const bcrypt = require("bcrypt");
const DATABASE = require("../../config/DATABASE/v1/DATABASE");
const LOGGER = require("../../config/LOGGER/v1/LOGGER");
const SYSTEM = require("./system");

class UserController extends LOGGER {
  static QUERIES = {
    CREATE: `INSERT INTO users (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    READ: `SELECT * FROM users WHERE user_id = $1`,
    UPDATE: `UPDATE users SET first_name = $1, middle_name = $2, last_name = $3, email = $4, phone = $5, gender = $6, dob = $7, country_code = $8, state_code = $9, city_name = $10, role_id = $11, is_allowed = $12 WHERE user_id = $13 RETURNING *`,
    DELETE: `DELETE FROM users WHERE user_id = $1`,
    UPDATE_PASSWORD: `UPDATE users SET password = $1 WHERE user_id = $2`,
    READ_USER_ID: `SELECT user_id FROM users WHERE user_id = $1`,
    USER_AUDIT: `INSERT INTO userh (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password, actions) SELECT user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password, $1 FROM users WHERE user_id = $2 RETURNING *`,
  };

  constructor(LOG_FILE_NAME = "/Controllers/UserController.log") {
    super(LOG_FILE_NAME);
    this.DB = DATABASE.CONNECTION;
  }

  /**
   * Hash a password using bcrypt.
   * @param {string} password - The password to hash.
   * @returns {Promise<string>} - The hashed password.
   */
  hashPassword = async (password) => bcrypt.hash(password, 10);

  /**
   * Generate a one-time password.
   * @param {number} length - The length of the password.
   * @returns {string} - The generated password.
   */
  generateOneTimePassword = (length = 8) => {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:<>?-=[];,./";
    return Array.from({ length }, () =>
      charset.charAt(Math.floor(Math.random() * charset.length))
    ).join("");
  };

  /**
   * Remove sensitive information (e.g., password) from a user object.
   * @param {object} user - The user object.
   * @returns {object} - The sanitized user object.
   */
  removePassword = (user) => {
    this.INFO("Removing sensitive details from user object");
    delete user.password;
    return user;
  };

  /**
   * Create a user history record.
   * @param {string} action - The action performed (e.g., "U" for update).
   * @param {string} user_id - The user ID.
   * @returns {Promise<object>} - The result of the query.
   */
  createUserHistory = async (action, user_id) =>
    this.DB.oneOrNone(UserController.QUERIES.USER_AUDIT, [action, user_id]);

  /**
   * Send an error response.
   * @param {object} res - The response object.
   * @param {Error} error - The error object.
   */
  sendErrorResp = (res, error) => {
    const ErrorResponse = DATABASE.handleDatabaseError(error);
    this.ERROR(`Error: ${error.message}`);
    this.DEBUG(JSON.stringify(error));
    res.status(ErrorResponse.serverResponseCode).json(ErrorResponse);
  };

  /**
   * Create a new user.
   * @param {object} user - The user data.
   * @returns {Promise<object>} - The created user.
   */
  createUser = async (user) => {
    const {
      user_id,
      first_name,
      middle_name,
      last_name,
      email,
      phone,
      gender,
      dob,
      country_code,
      state_code,
      city_name,
      role_id,
      is_allowed,
    } = user;

    let password = this.generateOneTimePassword();
    this.INFO(
      `Password Hashing Required: ${SYSTEM.PasswordHashingRequired} on System Level`
    );

    if (SYSTEM.PasswordHashingRequired) {
      password = await this.hashPassword(password);
    }

    try {
      DATABASE.BEGIN();
      this.INFO("Transaction Started");

      const result = await this.DB.oneOrNone(UserController.QUERIES.CREATE, [
        user_id,
        first_name,
        middle_name,
        last_name,
        email,
        phone,
        gender,
        dob,
        country_code,
        state_code,
        city_name,
        role_id,
        is_allowed || "Y",
        password,
      ]);

      this.DEBUG(JSON.stringify(result));
      this.INFO("User created successfully");

      DATABASE.COMMIT();
      this.INFO("Transaction Committed");

      return result;
    } catch (error) {
      DATABASE.ROLLBACK();
      this.INFO("Transaction Rolled Back");
      throw error;
    }
  };

  /**
   * Handle the create user API request.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  createUserApi = async (req, res) => {
    try {
      const result = await this.createUser(req.body.user);
      res.status(201).json({
        serverResponseCode: "201",
        responseDescription: "User created successfully",
        user: SYSTEM.SendPasswordInResp ? result : this.removePassword(result),
      });
    } catch (error) {
      this.sendErrorResp(res, error);
    }
  };

  /**
   * Retrieve a user by ID.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  getUser = async (req, res) => {
    try {
      const { user_id } = req.params;

      if (!user_id) {
        return res.status(400).json({
          serverResponseCode: "400",
          responseDescription: "User ID is required",
        });
      }

      this.INFO("Fetching user from the database");

      const user = await this.DB.oneOrNone(UserController.QUERIES.READ, [
        user_id,
      ]);

      if (!user) {
        return res.status(404).json({
          serverResponseCode: "404",
          responseDescription: "User not found",
        });
      }

      this.INFO("User retrieved successfully");

      res.status(200).json({
        serverResponseCode: "200",
        responseDescription: "User retrieved successfully",
        user: SYSTEM.SendPasswordInResp ? user : this.removePassword(user),
      });
    } catch (error) {
      this.sendErrorResp(res, error);
    }
  };

  /**
   * Update a user.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  updateUser = async (req, res) => {
    const { user_id, ...fields } = req.body.user;

    if (!user_id) {
      this.WARNING("User ID is required");
      return res.status(400).json({
        serverResponseCode: 400,
        responseDescription: "User ID is required",
      });
    }

    const fieldsToUpdate = [];
    const values = Object.entries(fields).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        fieldsToUpdate.push(`${key} = $${acc.length + 1}`);
        acc.push(value);
      }
      return acc;
    }, []);

    values.push(user_id);

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        serverResponseCode: 400,
        responseDescription: "No fields provided for update",
      });
    }

    const QUERY = `UPDATE users SET ${fieldsToUpdate.join(
      ", "
    )} WHERE user_id = $${values.length} RETURNING *`;

    try {
      if (SYSTEM.CreateUserHistory) {
        await this.createUserHistory("U", user_id);
      }

      const result = await this.DB.oneOrNone(QUERY, values);

      if (!result) {
        return res.status(404).json({
          serverResponseCode: 404,
          responseDescription: "User not found",
        });
      }

      res.status(200).json({
        serverResponseCode: 200,
        responseDescription: "User updated successfully",
        user: SYSTEM.SendPasswordInResp ? result : this.removePassword(result),
      });
    } catch (error) {
      this.sendErrorResp(res, error);
    }
  };

  /**
   * Update a user's password.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  updatePassword = async (req, res) => {
    const { user_id, newPassword } = req.body;

    if (!user_id || !newPassword) {
      this.WARNING("User ID and new password are required");
      return res.status(400).json({
        serverResponseCode: 400,
        responseDescription: "User ID and new password are required",
      });
    }

    try {
      this.INFO(
        `Password Hashing Required: ${SYSTEM.PasswordHashingRequired} on System Level`
      );

      let password = newPassword;

      if (SYSTEM.PasswordHashingRequired) {
        password = await this.hashPassword(password);
      }

      if (SYSTEM.CreateUserHistory) {
        await this.createUserHistory("U", user_id);
      }

      const result = await this.DB.result(
        UserController.QUERIES.UPDATE_PASSWORD,
        [password, user_id]
      );

      res.status(result.rowCount > 0 ? 200 : 404).json({
        serverResponseCode: result.rowCount > 0 ? "200" : "404",
        responseDescription:
          result.rowCount > 0
            ? "Password updated successfully"
            : "User not found",
      });
    } catch (error) {
      this.sendErrorResp(res, error);
    }
  };

  /**
   * Delete a user.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  deleteUser = async (req, res) => {
    const { user_id } = req.params;
    try {
      if (SYSTEM.CreateUserHistory) {
        await this.createUserHistory("U", user_id);
      }
      const result = await this.DB.result(UserController.QUERIES.DELETE, [
        user_id,
      ]);
      res.status(result.rowCount > 0 ? 200 : 404).json({
        serverResponseCode: result.rowCount > 0 ? "200" : "404",
        responseDescription:
          result.rowCount > 0 ? "User deleted successfully" : "User not found",
      });
    } catch (error) {
      this.sendErrorResp(res, error);
    }
  };
}

module.exports = UserController;