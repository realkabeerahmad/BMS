const bcrypt = require("bcrypt");
const DATABASE = require("../../DATABASE/v1/DATABASE");
const LOGGER = require("../../logger/v1/logger");

class USER extends LOGGER {
  static queries = {
    CREATE: `INSERT INTO users (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    READ: `SELECT * FROM users WHERE user_id = $1`,
    UPDATE: `UPDATE users SET first_name = $1,  middle_name = $2, last_name = $3, email = $4,  phone = $5,  gender = $6,  dob = $7, country_code = $8, state_code = $9,  city_name = $10,  role_id = $11, is_allowed = $12 WHERE user_id = $13 RETURNING *;`,
    DELETE: `DELETE FROM users WHERE user_id = $1`,
    UPDATE_PASSWORD: `UPDATE users SET password = $1 WHERE user_id = $2`,
    READ_USER_ID: `SELECT user_id FROM users WHERE user_id = $1`,
  };

  constructor() {
    super("user.log", process.env.LOG_LEVEL);
    this.DB = new DATABASE("user.log");
  }
  // Utility method to hash password
  hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  };

  generateOneTimePassword = (length = 8) => {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:<>?-=[];,./";
    let password = "";
    let charSetLength = charset.length;
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charSetLength);
      password += charset[randomIndex];
    }

    return password;
  };

  getUserFromDB = async (user_id, query) => {
    const user = await this.DB.CONNECTION.oneOrNone(query, [user_id]);
    return user;
  };

  // Create a new user with encrypted password
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
    const user = await this.getUserFromDB(user_id, USER.queries.READ_USER_ID);
    if (!user) {
      try {
        const password = this.generateOneTimePassword(8);
        // Await the hashing of the password
        const hashedPassword = await this.hashPassword(password);
        this.DEBUG("Query used to create user: " + USER.queries.CREATE);
        // Insert user into the database
        const result = await this.DB.CONNECTION.oneOrNone(USER.queries.CREATE, [
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
        this.INFO("User created successfully");
        res.status(201).json({
          responseCode: "201",
          description: "User created successfully",
          user: result,
        });
      } catch (error) {
        this.ERROR("Error creating user: " + error);
        res
          .status(500)
          .json({ responseCode: "500", description: "Failed to create user" });
      }
    } else {
      this.DEBUG(JSON.stringify(req.body.user));
      res
        .status(400)
        .json({ responseCode: "400", description: "User Already exist" });
    }
  };

  // Get user by ID
  getUser = async (req, res) => {
    const { user_id } = req.params;
    this.DEBUG("USER ID GOT IN REQUEST IS: " + user_id);
    const user = await this.getUserFromDB(user_id, USER.queries.READ);
    try {
      if (user) {
        delete user.password; // Remove password from response for security
        this.INFO("User retrieved successfully");
        res.status(200).json({
          responseCode: "200",
          description: "User retrieved successfully",
          user: user,
        });
      } else {
        this.WARNING("User not found");
        res
          .status(404)
          .json({ responseCode: "404", description: "User not found" });
      }
    } catch (error) {
      this.ERROR("Error retrieving user:" + error);
      res
        .status(500)
        .json({ responseCode: "500", description: "Failed to retrieve user" });
    }
  };

  // Update user by ID
  updateUser = async (req, res) => {
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

    if (!user_id) {
      this.WARNING("User ID is required");
      return res
        .status(400)
        .json({ responseCode: "400", description: "User ID is required" });
    }

    try {
      const user = await this.getUserFromDB(user_id, USER.queries.READ);

      if (!user) {
        this.WARNING("User not found");
        return res
          .status(404)
          .json({ responseCode: "404", description: "User not found" });
      }

      this.INFO("Updating user:", JSON.stringify(req.body.user));

      // Fields to update and corresponding values
      const fieldsToUpdate = [];
      const values = [];

      // Add only fields that are provided in the request body
      if (first_name !== undefined) {
        fieldsToUpdate.push("first_name = $1");
        values.push(first_name);
      }
      if (middle_name !== undefined) {
        fieldsToUpdate.push("middle_name = $" + (values.length + 1));
        values.push(middle_name);
      }
      if (last_name !== undefined) {
        fieldsToUpdate.push("last_name = $" + (values.length + 1));
        values.push(last_name);
      }
      if (email !== undefined) {
        fieldsToUpdate.push("email = $" + (values.length + 1));
        values.push(email);
      }
      if (phone !== undefined) {
        fieldsToUpdate.push("phone = $" + (values.length + 1));
        values.push(phone);
      }
      if (gender !== undefined) {
        fieldsToUpdate.push("gender = $" + (values.length + 1));
        values.push(gender);
      }
      if (dob !== undefined) {
        fieldsToUpdate.push("dob = $" + (values.length + 1));
        values.push(dob);
      }
      if (country_code !== undefined) {
        fieldsToUpdate.push("country_code = $" + (values.length + 1));
        values.push(country_code);
      }
      if (state_code !== undefined) {
        fieldsToUpdate.push("state_code = $" + (values.length + 1));
        values.push(state_code);
      }
      if (city_name !== undefined) {
        fieldsToUpdate.push("city_name = $" + (values.length + 1));
        values.push(city_name);
      }
      if (role_id !== undefined) {
        fieldsToUpdate.push("role_id = $" + (values.length + 1));
        values.push(role_id);
      }
      if (is_allowed !== undefined) {
        fieldsToUpdate.push("is_allowed = $" + (values.length + 1));
        values.push(is_allowed);
      }

      // If no fields to update, return without making a database call
      if (fieldsToUpdate.length === 0) {
        this.WARNING("No fields provided for update");
        return res.status(400).send({ error: "No fields provided for update" });
      }

      // Add user_id as the last parameter for the WHERE clause
      values.push(user_id);
      const query = `UPDATE users SET ${fieldsToUpdate.join(
        ", "
      )} WHERE user_id = $${values.length}`;
      this.DEBUG(query);
      // Execute the update query
      const result = await this.DB.CONNECTION.result(query, values);

      if (result.rowCount > 0) {
        this.INFO("User updated successfully");
        res.status(200).json({
          responseCode: "200",
          description: "User updated successfully",
          user: result.rows,
        });
      } else {
        this.WARNING("Failed to update user - no changes applied");
        res
          .status(304)
          .json({
            responseCode: "304",
            description: "No changes made to the user",
          });
      }
    } catch (error) {
      this.ERROR("Error updating user: " + error);
      res
        .status(500)
        .json({ responseCode: "500", description: "Failed to update user" });
    }
  };

  // Update user password
  updatePassword = async (req, res) => {
    const { user_id, newPassword } = req.body;

    try {
      const hashedPassword = await this.hashPassword(newPassword);
      const result = await this.DB.CONNECTION.oneOrNone(
        USER.queries.UPDATE_PASSWORD,
        [hashedPassword, user_id]
      );

      if (result.affectedRows > 0) {
        this.INFO("Password updated successfully");
        res.status(200).send({ message: "Password updated successfully" });
      } else {
        this.WARNING("User not found");
        res.status(404).send({ message: "User not found" });
      }
    } catch (error) {
      this.ERROR("Error updating password:", error);
      res.status(500).send({ error: "Failed to update password" });
    }
  };

  // Delete user by ID
  deleteUser = async (req, res) => {
    const { user_id } = req.params;

    try {
      const result = await this.DB.execute(USER.queries.DELETE, [user_id]);
      if (result.affectedRows > 0) {
        this.INFO("User deleted successfully");
        res.status(200).send({ message: "User deleted successfully" });
      } else {
        this.WARNING("User not found");
        res.status(404).send({ message: "User not found" });
      }
    } catch (error) {
      this.ERROR("Error deleting user:", error);
      res.status(500).send({ error: "Failed to delete user" });
    }
  };
}

module.exports = USER;
