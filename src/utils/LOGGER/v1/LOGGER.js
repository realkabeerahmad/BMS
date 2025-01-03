const fs = require("fs");

class LOGGER {
  static LEVEL = {
    INFO: "INFO",
    DEBUG: "DEBUG",
    WARNING: "WARN",
    ERROR: "ERROR",
    EXCEPTION: "EXCEPTION",
  };
  constructor(
    FILE_NAME = "root.log",
    LOG_MOD = LOGGER.LEVEL.DEBUG,
    FILE_PATH = "./logs/",
    BACKUP_FILE_PATH = "./logs/backup/"
  ) {
    this.FILE_NAME = FILE_NAME;
    this.LOG_MOD = LOG_MOD;
    this.FILE_PATH = FILE_PATH;
    this.BACKUP_FILE_PATH = BACKUP_FILE_PATH;
    this.LOGS_PATH = this.FILE_PATH + this.FILE_NAME;
    this.OUTPUT = fs.createWriteStream(this.LOGS_PATH, {
      flags: this.LOG_MOD == LOGGER.LEVEL.INFO ? "w" : "a",
    });
    this.CONSOLER = new console.Console(this.OUTPUT, this.OUTPUT);
  }
  LOG(MESSAGE) {
    // const callerInfo = this.getCallerInfo();
    const className = this.constructor.name;

    this.CONSOLER.log(
      `[${new Date()
        .toISOString()
        .replace("T", " ")
        .replace("Z", "")}] - (${className}) - ${MESSAGE}`
    );
  }

  getCallerInfo() {
    const stack = new Error().stack.split("\n");

    // The stack trace has the following structure:
    // at <method name> (<file>:<line>:<column>)
    // at <caller method> (<file>:<line>:<column>)

    // Stack line 3 will contain the method where this method was called (direct caller)
    const callerStackLine = stack[3] || stack[2]; // Ensure we capture the correct line in all cases
    // console.log(callerStackLine);

    // Extract method name and location
    const methodMatch = callerStackLine.match(/at\s(.+?)\s\(/);
    const method = methodMatch ? methodMatch[1] : "Unknown method";

    return {
      method,
    };
  }

  INFO(MESSAGE) {
    this.LOG(`[✅] - [${LOGGER.LEVEL.INFO}] - ${MESSAGE}`);
  }
  EXCEPTION(MESSAGE) {
    this.LOG(`[❌] - [${LOGGER.LEVEL.EXCEPTION}] - ${MESSAGE}`);
  }
  ERROR(MESSAGE) {
    this.LOG(`[❌] - [${LOGGER.LEVEL.ERROR}] - ${MESSAGE}`);
  }
  WARNING(MESSAGE) {
    this.LOG(`[⚠️] - [${LOGGER.LEVEL.WARNING}] - ${MESSAGE}`);
  }
  DEBUG(MESSAGE) {
    if (this.LOG_MOD === LOGGER.LEVEL.DEBUG)
      this.LOG(`[☕] - [${LOGGER.LEVEL.DEBUG}] - ${MESSAGE}`);
  }
}

module.exports = LOGGER;
