const DATABASE = require("../../DATABASE/v1/DATABASE");
const LOGGER = require("../../logger/v1/logger");

class SYSTEM extends LOGGER {
  // Cache variables
  static PasswordHashingRequired = false;
  static SendPasswordInResp = false;
  static CreateUserHistory = false;

  // Internal property to manage cache refresh
  static lastUpdated = null;

  constructor() {
    super();
    this.INFO(
      "Initializing SYSTEM class and loading cache for the first time."
    );
    // Load initial values from DB
    SYSTEM.refreshCache();
    // Set up automatic refresh every 10 minutes
    setInterval(() => SYSTEM.refreshCache(), 0.0001 * 60 * 1000);
  }

  // Method to refresh the cache from the database
  static async refreshCache() {
    const logger = new LOGGER();
    logger.INFO("Starting cache refresh from the database...");
    try {
      const DB = DATABASE.CONNECTION;

      // Query database to update values
      const params = await DB.query(`
        SELECT PARAM_ID, param_value 
        FROM SYSTEM_PARAMETERS 
        WHERE PARAM_ID IN (
          'PasswordHashingRequired', 
          'SendPasswordInResp', 
          'CreateUserHistory'
        )
      `);

      // Logging the fetched parameters
      logger.DEBUG("Fetched parameters from the database:" + params);

      // Update class variables based on query result
      params.forEach(({ param_id, param_value }) => {
        switch (param_id) {
          case "PasswordHashingRequired":
            SYSTEM.PasswordHashingRequired = param_value === "Y";
            logger.INFO(
              "PasswordHashingRequired set to:" + SYSTEM.PasswordHashingRequired
            );
            break;
          case "SendPasswordInResp":
            SYSTEM.SendPasswordInResp = param_value === "Y";
            logger.INFO(
              "SendPasswordInResp set to:" + SYSTEM.SendPasswordInResp
            );
            break;
          case "CreateUserHistory":
            SYSTEM.CreateUserHistory = param_value === "Y";
            logger.INFO("CreateUserHistory set to:" + SYSTEM.CreateUserHistory);
            break;
          default:
            logger.WARN("Unexpected PARAM_ID:" + param_id);
            break;
        }
      });

      SYSTEM.lastUpdated = new Date();
      logger.INFO(
        "SYSTEM cache successfully refreshed at:" + SYSTEM.lastUpdated
      );
    } catch (error) {
      logger.ERROR("Failed to refresh SYSTEM cache:" + error);
    }
  }

  // Method to manually refresh the cache
  static async hardRefresh(req, res) {
    const logger = new LOGGER();
    logger.INFO("Received request to manually refresh the SYSTEM cache.");
    try {
      await SYSTEM.refreshCache();
      logger.INFO("Cache manually refreshed successfully.");
      res.status(200).json({
        serverResponseCode: 200,
        responseDescription: "Cache refreshed successfully",
        lastUpdated: SYSTEM.lastUpdated,
      });
    } catch (error) {
      logger.ERROR(
        "Error occurred while manually refreshing the cache:" + error
      );
      res.status(500).json({
        serverResponseCode: 500,
        responseDescription: "Failed to refresh cache",
        error: error.message,
      });
    }
  }
}

module.exports = SYSTEM;
