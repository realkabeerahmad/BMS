const bcrypt = require("bcrypt");
const DATABASE = require("../../DATABASE/v1/DATABASE");
const LOGGER = require("../../logger/v1/logger");

class USER extends LOGGER {
  static queries = {
    CREATE: `INSERT INTO users (user_id, first_name, middle_name, last_name, email, phone, gender, dob, country_code, state_code, city_name, role_id, is_allowed, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    READ: `SELECT * FROM users WHERE user_id = $1`,
    UPDATE: `UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ?, gender = ?, dob = ?, country_code = ?, state_code = ?, city_name = ?, role_id = ?, is_allowed = ? WHERE user_id = ?`,
    DELETE: `DELETE FROM users WHERE user_id = ?`,
    UPDATE_PASSWORD: `UPDATE users SET password = ? WHERE user_id = ?`,
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

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
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

    this.DEBUG(JSON.stringify(req.body.user));

    try {
      const password = this.generateOneTimePassword(8);
      if (!password) {
        this.ERROR("Password is required");
        return res.status(400).send({ error: "Password is required" });
      }

      // Await the hashing of the password
      const hashedPassword = await this.hashPassword(password);
      this.DEBUG("Password generated: " + password);
      this.DEBUG("Hashed Password: " + hashedPassword);
      this.DEBUG("Query used to create user: " + USER.queries.CREATE);

      if (!this.DB.CONNECTION) throw new Error("ISSUE IN DB CONNECTION");

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
        hashedPassword, // Ensure hashedPassword is a string
      ]);

      this.INFO("User created successfully");
      res
        .status(201)
        .send({ message: "User created successfully", user: result });
    } catch (error) {
      this.ERROR("Error creating user: " + error);
      res.status(500).send({ error: "Failed to create user" });
    } finally {
      this.INFO("API Request fulfilled".toUpperCase());
    }
  };

  // Get user by ID
  getUser = async (req, res) => {
    const { user_id } = req.params;
    this.DEBUG("USER ID GOT IN REQUEST IS: " + user_id);
    try {
      const user = await this.DB.CONNECTION.oneOrNone(USER.queries.READ, [
        user_id,
      ]);
      if (user) {
        delete user.password; // Remove password from response for security
        this.INFO("User retrieved successfully");
        res.status(200).send(user);
      } else {
        this.WARNING("User not found");
        res.status(404).send({ message: "User not found" });
      }
    } catch (error) {
      this.ERROR("Error retrieving user:" + error);
      res.status(500).send({ error: "Failed to retrieve user" });
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

    try {
      const result = await this.DB.execute(USER.queries.UPDATE, [
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
        user_id,
      ]);
      if (result.affectedRows > 0) {
        this.INFO("User updated successfully");
        res.status(200).send({ message: "User updated successfully" });
      } else {
        this.WARNING("User not found");
        res.status(404).send({ message: "User not found" });
      }
    } catch (error) {
      this.ERROR("Error updating user:", error);
      res.status(500).send({ error: "Failed to update user" });
    }
  };

  // Update user password
  updatePassword = async (req, res) => {
    const { user_id, newPassword } = req.body;

    try {
      const hashedPassword = await this.hashPassword(newPassword);
      const result = await this.DB.execute(USER.queries.UPDATE_PASSWORD, [
        hashedPassword,
        user_id,
      ]);

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
