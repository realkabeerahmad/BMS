const fs = require("fs");
const path = require("path");

module.exports = class LOGGER {
  static LEVEL = {
    INFO: "INFO",
    DEBUG: "DEBUG",
    WARNING: "WARN",
    ERROR: "ERROR",
  };

  constructor(
    FILE_NAME = "root.log", // Default file is root.log
    LOG_MOD = LOGGER.LEVEL.DEBUG, // Default mode is DEBUG
    FILE_PATH = "./logs/" // Default path is /logs
  ) {
    this.FILE_NAME = FILE_NAME;
    this.LOG_MOD = LOG_MOD;
    this.FILE_PATH = path.resolve(FILE_PATH); // Ensure absolute path
    this.LOGS_PATH = path.join(this.FILE_PATH, this.FILE_NAME);

    // Ensure directory exists
    this.ensureDirectoryExists(this.FILE_PATH);

    // Create writable stream for logging
    try {
      this.OUTPUT = fs.createWriteStream(this.LOGS_PATH, {
        flags: "a", // Append to the file
      });
    } catch (error) {
      console.error(`Failed to create write stream: ${error.message}`);
      throw error;
    }
  }

  ensureDirectoryExists(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
      }
    } catch (error) {
      console.error(`Failed to create directory: ${error.message}`);
      throw error;
    }
  }

  LOG(MESSAGE) {
    const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
    const logMessage = `[${timestamp}] - ${MESSAGE}\n`;

    try {
      this.OUTPUT.write(logMessage);
    } catch (error) {
      console.error(`Failed to write log: ${error.message}`);
    }
  }

  INFO(MESSAGE) {
    if (this.LOG_MOD === LOGGER.LEVEL.INFO || this.LOG_MOD === LOGGER.LEVEL.DEBUG) {
      this.LOG(`[${LOGGER.LEVEL.INFO}] - ${MESSAGE}`);
    }
  }

  ERROR(MESSAGE) {
    this.LOG(`[${LOGGER.LEVEL.ERROR}] - ${MESSAGE}`);
  }

  WARNING(MESSAGE) {
    this.LOG(`[${LOGGER.LEVEL.WARNING}] - ${MESSAGE}`);
  }

  DEBUG(MESSAGE) {
    if (this.LOG_MOD === LOGGER.LEVEL.DEBUG) {
      this.LOG(`[${LOGGER.LEVEL.DEBUG}] - ${MESSAGE}`);
    }
  }
};