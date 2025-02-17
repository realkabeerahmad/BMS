const express = require("express");
const fs = require("fs");
const path = require("path");
const LOGGER = require("../../LOGGER/v1/LOGGER");

module.exports = class ROUTER extends LOGGER {
  constructor() {
    super(process.env.LOGS_FILE_PATH, process.env.LOG_LEVEL);
    this.router = express.Router();
  }

  /**
   * Attach middleware to the router.
   * @param {Function} middleware - The middleware function to attach.
   */
  useMiddleware(middleware) {
    this.router.use(middleware);
    this.INFO(`Middleware attached to router: ${middleware.name || "anonymous"}`);
  }

  /**
   * Load routes from a specified directory.
   * @param {string} routesDir - The directory containing route files.
   */
  loadRoutes(routesDir) {
    try {
      const files = fs.readdirSync(routesDir);

      files.forEach((file) => {
        const filePath = path.join(routesDir, file);
        const route = require(filePath);

        if (route && typeof route === "function") {
          this.router.use(route);
          this.INFO(`Route loaded: ${file}`);
        } else {
          this.WARN(`Skipping invalid route file: ${file}`);
        }
      });
    } catch (e) {
      this.ERROR(`Failed to load routes from directory ${routesDir}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Attach a centralized error-handling middleware to the router.
   */
  useErrorHandler() {
    this.router.use((err, req, res, next) => {
      this.ERROR(`Error occurred: ${err.message}`);
      res.status(500).json({
        status: "FAILURE",
        message: "An unexpected error occurred.",
        error: err.message,
      });
    });
  }

  /**
   * Get the Express router instance.
   * @returns {express.Router} - The router instance.
   */
  getRouter() {
    return this.router;
  }
};