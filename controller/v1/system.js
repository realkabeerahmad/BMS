const DATABASE = require("../../DATABASE/v1/DATABASE");

class SYSTEM {
  // Cache variables
  static PasswordHashingRequired = false;
  static SendPasswordInResp = false;
  static CreateUserHistory = false;

  // Internal property to manage cache refresh
  static lastUpdated = null;

  constructor() {
    console.info(
      "Initializing SYSTEM class and loading cache for the first time."
    );
    // Load initial values from DB
    this.refreshCache();
    // Set up automatic refresh every 10 minutes
    setInterval(this.refreshCache, 10 * 60 * 1000); // 10 minutes
  }

  // Method to refresh the cache from the database
  static async refreshCache() {
    console.info("Starting cache refresh from the database...");
    try {
      const db = new DATABASE().CONNECTION;

      // Query database to update values
      const params = await db.query(`
        SELECT PARAM_ID, param_value 
        FROM SYSTEM_PARAMETERS 
        WHERE PARAM_ID IN (
          'PasswordHashingRequired', 
          'SendPasswordInResp', 
          'CreateUserHistory'
        )
      `);

      // Logging the fetched parameters
      console.debug("Fetched parameters from the database:", params);

      // Update class variables based on query result
      params.forEach(({ param_id, param_value }) => {
        switch (param_id) {
          case "PasswordHashingRequired":
            SYSTEM.PasswordHashingRequired = param_value === "Y";
            console.info(
              "PasswordHashingRequired set to:",
              SYSTEM.PasswordHashingRequired
            );
            break;
          case "SendPasswordInResp":
            SYSTEM.SendPasswordInResp = param_value === "Y";
            console.info(
              "SendPasswordInResp set to:",
              SYSTEM.SendPasswordInResp
            );
            break;
          case "CreateUserHistory":
            SYSTEM.CreateUserHistory = param_value === "Y";
            console.info("CreateUserHistory set to:", SYSTEM.CreateUserHistory);
            break;
          default:
            console.warn("Unexpected PARAM_ID:", param_id);
            break;
        }
      });

      SYSTEM.lastUpdated = new Date();
      console.info(
        "SYSTEM cache successfully refreshed at:",
        SYSTEM.lastUpdated
      );
    } catch (error) {
      console.error("Failed to refresh SYSTEM cache:", error);
    }
  }

  // Method to manually refresh the cache
  static async hardRefresh(req, res) {
    console.info("Received request to manually refresh the SYSTEM cache.");
    try {
      await SYSTEM.refreshCache();
      console.info("Cache manually refreshed successfully.");
      res.status(200).json({
        serverResponseCode: 200,
        responseDescription: "Cache refreshed successfully",
        lastUpdated: SYSTEM.lastUpdated,
      });
    } catch (error) {
      console.error(
        "Error occurred while manually refreshing the cache:",
        error
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
