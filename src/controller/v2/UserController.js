const USERS = require("../../model/v1/USERS"); // Import the USERS model
const LOGGER = require("../../utils/LOGGER/v1/LOGGER");

class UserController extends LOGGER {
  constructor() {
    super();
  }
  // Create a new user
  async createUser(userData) {
    try {
      this.INFO("Creating user with data:" + JSON.stringify(userData));
      const newUser = await USERS.create(userData);
      this.INFO("USERS created:" + JSON.stringify(newUser));
      return newUser;
    } catch (error) {
      this.EXCEPTION("Error creating user:" + JSON.stringify(error));
      throw error;
    }
  }

  // Read a user by ID
  async getUserById(userId) {
    try {
      this.INFO(`Fetching user with user_id: ${userId}`);
      const user = await USERS.findByPk(userId);
      if (user) {
        this.INFO("USERS found:" + JSON.stringify(user));
        return user;
      } else {
        this.INFO("USERS not found");
        return null;
      }
    } catch (error) {
      this.EXCEPTION("Error fetching user:" + JSON.stringify(error));
      throw error;
    }
  }

  // Update a user by ID
  async updateUser(userId, updateData) {
    try {
      this.INFO(`Updating user with user_id: ${userId} with data:`, updateData);
      const [updated] = await USERS.update(updateData, {
        where: { user_id: userId },
      });
      if (updated) {
        const updatedUser = await USERS.findByPk(userId);
        this.INFO("USERS updated:" + JSON.stringify(updatedUser));
        return updatedUser;
      } else {
        this.INFO("USERS not found or no changes made");
        return null;
      }
    } catch (error) {
      this.EXCEPTION("Error updating user:" + JSON.stringify(error));
      throw error;
    }
  }

  // Delete a user by ID
  async deleteUser(userId) {
    try {
      this.INFO(`Deleting user with user_id: ${userId}`);
      const deleted = await USERS.destroy({
        where: { user_id: userId },
      });
      if (deleted) {
        this.INFO("USERS deleted");
        return true;
      } else {
        this.INFO("USERS not found");
        return false;
      }
    } catch (error) {
      this.EXCEPTION("Error deleting user:" + JSON.stringify(error));
      throw error;
    }
  }
}

module.exports = new UserController();
