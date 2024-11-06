const bcrypt = require("bcrypt");
const DATABASE = require("../../DATABASE/v1/DATABASE");
const LOGGER = require("../../logger/v1/logger");

class USER extends LOGGER {
  static QUERIES = {
    CREATE: `INSERT INTO users (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    READ: `SELECT * FROM users WHERE user_id = $1`,
    UPDATE: `UPDATE users SET first_name = $1,  middle_name = $2, last_name = $3, email = $4,  phone = $5,  gender = $6,  dob = $7, country_code = $8, state_code = $9,  city_name = $10,  role_id = $11, is_allowed = $12 WHERE user_id = $13 RETURNING *`,
    DELETE: `DELETE FROM users WHERE user_id = $1`,
    UPDATE_PASSWORD: `UPDATE users SET password = $1 WHERE user_id = $2`,
    READ_USER_ID: `SELECT user_id FROM users WHERE user_id = $1`,
    USER_AUDIT: `INSERT INTO userh (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password, actions) SELECT user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password, $1 FROM users WHERE user_id = $2 RETURNING *`,
  };

  constructor(LOG_FILE_NAME = "/Controllers/userController.log") {
    super(LOG_FILE_NAME);
    this.DB = new DATABASE(LOG_FILE_NAME).CONNECTION;
  }

  hashPassword = async (password) => bcrypt.hash(password, 10);

  generateOneTimePassword = (length = 8) => {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:<>?-=[];,./";
    return Array.from({ length }, () =>
      charset.charAt(Math.floor(Math.random() * charset.length))
    ).join("");
  };

  createUserHistory = async (action, user_id) =>
    this.DB.oneOrNone(USER.QUERIES.USER_AUDIT, [action, user_id]);

  sendErrorResp = (res, error) => {
    const ErrorResponse = DATABASE.handleDatabaseError(error);
    this.ERROR("Error creating user: " + JSON.stringify(ErrorResponse));
    this.DEBUG(JSON.stringify(error));
    res.status(ErrorResponse.responseCode).json(ErrorResponse);
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
      const hashedPassword = await this.hashPassword(
        this.generateOneTimePassword()
      );
      const result = await this.DB.oneOrNone(USER.QUERIES.CREATE, [
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
        hashedPassword,
      ]);
      this.DEBUG(JSON.stringify(result));
      this.INFO("User created successfully");
      res.status(201).json({
        responseCode: "201",
        description: "User created successfully",
        user: result,
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
          responseCode: "400",
          description: "User ID is required",
        });
      }

      this.INFO("Going to retrieve user");

      // Fetch user from the database
      const user = await this.DB.oneOrNone(USER.QUERIES.READ, [user_id]);

      if (!user) {
        return res.status(404).json({
          responseCode: "404",
          description: "User not found",
        });
      }

      this.INFO("Removing any secure details");

      // Remove sensitive data like password
      delete user.password;

      this.INFO("User retrieved successfully");

      // Send successful response
      res.status(200).json({
        responseCode: "200",
        description: "User retrieved successfully",
        user,
      });
    } catch (error) {
      // Handle any unexpected errors
      this.sendErrorResp(res, error);
    }
  };

  updateUser = async (req, res) => {
    const { user_id, ...fields } = req.body.user;

    if (!user_id) {
      this.WARNING("User ID is required");
      return res
        .status(400)
        .json({ responseCode: "400", description: "User ID is required" });
    }

    const user = await this.getUserFromDB(user_id, USER.QUERIES.READ);
    if (!user) {
      this.WARNING("User not found");
      return res
        .status(404)
        .json({ responseCode: "404", description: "User not found" });
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

    if (fieldsToUpdate.length === 0)
      return res.status(400).json({ error: "No fields provided for update" });

    const query = `UPDATE users SET ${fieldsToUpdate.join(
      ", "
    )} WHERE user_id = $${values.length} RETURNING *`;
    try {
      await this.createUserHistory("U", user_id);
      const result = await this.DB.result(query, values);
      res.status(result.rowCount > 0 ? 200 : 304).json({
        responseCode: result.rowCount > 0 ? "200" : "304",
        description:
          result.rowCount > 0
            ? "User updated successfully"
            : "No changes made to the user",
        user: result.rows,
      });
    } catch (error) {
      this.ERROR("Error updating user: " + error);
      res
        .status(500)
        .json({ responseCode: "500", description: "Failed to update user" });
    }
  };

  updatePassword = async (req, res) => {
    const { user_id, newPassword } = req.body;
    if (await this.getUserFromDB(user_id, USER.QUERIES.READ_USER_ID)) {
      try {
        const hashedPassword = await this.hashPassword(newPassword);
        await this.createUserHistory("U", user_id);
        const result = await this.DB.result(USER.QUERIES.UPDATE_PASSWORD, [
          hashedPassword,
          user_id,
        ]);
        res.status(result.rowCount > 0 ? 200 : 404).json({
          responseCode: result.rowCount > 0 ? "200" : "404",
          description:
            result.rowCount > 0
              ? "Password updated successfully"
              : "User not found",
        });
      } catch (error) {
        this.ERROR("Error updating password: " + error);
        res.status(500).json({
          responseCode: "500",
          description: "Failed to update password",
        });
      }
    } else {
      this.WARNING("User not found");
      res
        .status(404)
        .json({ responseCode: "404", description: "User not found" });
    }
  };

  deleteUser = async (req, res) => {
    const { user_id } = req.params;
    try {
      await this.createUserHistory("D", user_id);
      const result = await this.DB.result(USER.QUERIES.DELETE, [user_id]);
      res.status(result.rowCount > 0 ? 200 : 404).json({
        responseCode: result.rowCount > 0 ? "200" : "404",
        description:
          result.rowCount > 0 ? "User deleted successfully" : "User not found",
      });
    } catch (error) {
      this.ERROR("Error deleting user: " + error);
      res
        .status(500)
        .json({ responseCode: "500", description: "Failed to delete user" });
    }
  };
}

module.exports = USER;
