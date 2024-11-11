const bcrypt = require("bcrypt");
const DATABASE = require("../../utils/DATABASE/v1/DATABASE");
const LOGGER = require("../../utils/LOGGER/v1/logger");
const SYSTEM = require("./system");

class UserController extends LOGGER {
  static QUERIES = {
    CREATE: `INSERT INTO users (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    READ: `SELECT * FROM users WHERE user_id = $1`,
    UPDATE: `UPDATE users SET first_name = $1,  middle_name = $2, last_name = $3, email = $4,  phone = $5,  gender = $6,  dob = $7, country_code = $8, state_code = $9,  city_name = $10,  role_id = $11, is_allowed = $12 WHERE user_id = $13 RETURNING *`,
    DELETE: `DELETE FROM users WHERE user_id = $1`,
    UPDATE_PASSWORD: `UPDATE users SET password = $1 WHERE user_id = $2`,
    READ_USER_ID: `SELECT user_id FROM users WHERE user_id = $1`,
    USER_AUDIT: `INSERT INTO userh (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password, actions) SELECT user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password, $1 FROM users WHERE user_id = $2 RETURNING *`,
  };

  constructor(LOG_FILE_NAME = "/Controllers/UserController.log") {
    super(LOG_FILE_NAME);
    this.DB = DATABASE.CONNECTION;
  }

  hashPassword = async (password) => bcrypt.hash(password, 10);

  generateOneTimePassword = (length = 8) => {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:<>?-=[];,./";
    return Array.from({ length }, () =>
      charset.charAt(Math.floor(Math.random() * charset.length))
    ).join("");
  };

  removePassword = (user) => {
    this.INFO("Removing any secure details");
    delete user.password;
    return user;
  };

  createUserHistory = async (action, user_id) =>
    this.DB.oneOrNone(UserController.QUERIES.USER_AUDIT, [action, user_id]);

  sendErrorResp = (res, error) => {
    const ErrorResponse = DATABASE.handleDatabaseError(error);
    this.ERROR("Error: " + error);
    this.DEBUG(JSON.stringify(error));
    res.status(ErrorResponse.serverResponseCode).json(ErrorResponse);
  };

  createUser = async (req, res) => {
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
    } = req.body.user;
    try {
      let password = this.generateOneTimePassword();
      this.INFO(
        "Password Hashing Required " +
          SYSTEM.PasswordHashingRequired +
          " on System Level"
      );
      if (SYSTEM.PasswordHashingRequired) {
        password = await this.hashPassword(password);
      }
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
      res.status(201).json({
        serverResponseCode: "201",
        responseDescription: "User created successfully",
        user: SYSTEM.SendPasswordInResp ? result : this.removePassword(result),
      });
    } catch (error) {
      this.sendErrorResp(res, error);
    }
  };

  getUser = async (req, res) => {
    try {
      const { user_id } = req.params;

      if (!user_id) {
        return res.status(400).json({
          serverResponseCode: "400",
          responseDescription: "User ID is required",
        });
      }

      this.INFO("Going to retrieve user");

      // Fetch user from the database
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

      // Send successful response
      res.status(200).json({
        serverResponseCode: "200",
        responseDescription: "User retrieved successfully",
        user: SYSTEM.SendPasswordInResp ? user : this.removePassword(user),
      });
    } catch (error) {
      // Handle any unexpected errors
      this.sendErrorResp(res, error);
    }
  };

  updateUser = async (req, res) => {
    const { user_id, ...fields } = req.body.user;

    // Check if user_id is provided
    if (!user_id) {
      this.WARNING("User ID is required");
      return res.status(400).json({
        serverResponseCode: 400,
        responseDescription: "User ID is required",
      });
    }

    // Collect fields to update
    const fieldsToUpdate = [];
    const values = Object.entries(fields).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        fieldsToUpdate.push(`${key} = $${acc.length + 1}`);
        acc.push(value);
      }
      return acc;
    }, []);

    // Add user_id to values
    values.push(user_id);

    // Check if there are fields to update
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        serverResponseCode: 400,
        responseDescription: "No fields provided for update",
      });
    }

    // Construct the query
    const QUERY = `UPDATE users SET ${fieldsToUpdate.join(
      ", "
    )} WHERE user_id = $${values.length} RETURNING *`;

    try {
      // Optional: Create user history if required
      if (SYSTEM.CreateUserHistory) {
        await this.createUserHistory("U", user_id);
      }

      // Execute the query
      const result = await this.DB.oneOrNone(QUERY, values);

      // Check for a result and respond
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
      // Handle errors
      this.sendErrorResp(res, error);
    }
  };

  updatePassword = async (req, res) => {
    const { user_id, newPassword } = req.body;

    // Check for required fields
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

      // Hash the password if required by the system configuration
      if (SYSTEM.PasswordHashingRequired) {
        password = await this.hashPassword(password);
      }

      // Optionally, create user history if the setting is enabled
      if (SYSTEM.CreateUserHistory) {
        await this.createUserHistory("U", user_id);
      }

      // Execute the password update query
      const result = await this.DB.result(
        UserController.QUERIES.UPDATE_PASSWORD,
        [password, user_id]
      );

      // Send response based on the result of the update operation
      res.status(result.rowCount > 0 ? 200 : 404).json({
        serverResponseCode: result.rowCount > 0 ? "200" : "404",
        responseDescription:
          result.rowCount > 0
            ? "Password updated successfully"
            : "User not found",
      });
    } catch (error) {
      // Send error response if an exception occurs
      this.sendErrorResp(res, error);
    }
  };

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
      // Send error response if an exception occurs
      this.sendErrorResp(res, error);
    }
  };
}

module.exports = UserController;
