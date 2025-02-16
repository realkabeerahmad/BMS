const fs = require("fs");
const path = require("path");

module.exports = class LOGGER {
  static LEVEL = {
    INFO: "INFO",
    DEBUG: "DEBUG",
    WARNING: "WARN",
    ERROR: "ERROR",
    EXCEPTION: "EXCEPTION", // Not Applicable in Node JS
  };

  constructor(
    FILE_NAME = "root.log", // Default file is root.log
    LOG_MOD = LOGGER.LEVEL.DEBUG, // Default mode is DEBUG
    FILE_PATH = "./logs/", // Default path is /logs
    BACKUP_FILE_PATH = "./logs/backup/" // Default backup path is /logs/backup
  ) {
    this.FILE_NAME = FILE_NAME;
    this.LOG_MOD = LOG_MOD;
    this.FILE_PATH = path.resolve(FILE_PATH); // Ensure absolute path
    this.BACKUP_FILE_PATH = path.resolve(BACKUP_FILE_PATH);
    this.LOGS_PATH = path.join(this.FILE_PATH, this.FILE_NAME);

    // Ensure directories and file exist
    this.ensureDirectoryExists(this.FILE_PATH);
    this.ensureDirectoryExists(this.BACKUP_FILE_PATH);
    this.ensureFileExists(this.LOGS_PATH);

    // Create writable stream for logging
    this.OUTPUT = fs.createWriteStream(this.LOGS_PATH, {
      flags: this.LOG_MOD === LOGGER.LEVEL.INFO ? "w" : "a",
    });

    this.CONSOLER = new console.Console(this.OUTPUT, this.OUTPUT);
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }

  ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, ""); // Create empty file if missing
      console.log(`Created log file: ${filePath}`);
    }
  }

  LOG(MESSAGE) {
    this.CONSOLER.log(
      `[${new Date()
        .toISOString()
        .replace("T", " ")
        .replace("Z", "")}] - ${MESSAGE}`
    );
  }

  INFO(MESSAGE) {
    this.LOG(`[${LOGGER.LEVEL.INFO}] - ${MESSAGE}`);
  }
  EXCEPTION(MESSAGE) {
    this.LOG(`[${LOGGER.LEVEL.EXCEPTION}] - ${MESSAGE}`);
  }
  ERROR(MESSAGE) {
    this.LOG(`[${LOGGER.LEVEL.ERROR}] - ${MESSAGE}`);
  }
  WARNING(MESSAGE) {
    this.LOG(`[${LOGGER.LEVEL.WARNING}] - ${MESSAGE}`);
  }
  DEBUG(MESSAGE) {
    if (this.LOG_MOD === LOGGER.LEVEL.DEBUG)
      this.LOG(`[${LOGGER.LEVEL.DEBUG}] - ${MESSAGE}`);
  }
}