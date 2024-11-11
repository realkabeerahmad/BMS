const fs = require("fs");

class LOGGER {
  static LEVEL = {
    INFO: "INFO",
    DEBUG: "DEBUG",
    ERROR: "ERROR",
    EXCEPTION: "EXCEPTION",
  };
  constructor(
    FILE_NAME = "main.log",
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
      flags: this.LOG_MOD == "INFO" ? "w" : "a",
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
    const callerStackLine = stack[3]; // Line 3 will have the caller function info

    // Extract method name (this might vary based on the environment)
    const methodMatch = callerStackLine.match(/at\s(\S+)\s/);
    const method = methodMatch ? methodMatch[1] : "Unknown method";

    return {
      method,
    };
  }

  INFO(MESSAGE) {
    this.LOG(`[INFO] - ${MESSAGE}`);
  }
  EXCEPTION(MESSAGE) {
    this.LOG(`[EXCEPTION] - ${MESSAGE}`);
  }
  ERROR(MESSAGE) {
    this.LOG(`[ERROR] - ${MESSAGE}`);
  }
  WARNING(MESSAGE) {
    this.LOG(`[WARNING] - ${MESSAGE}`);
  }
  DEBUG(MESSAGE) {
    if (this.LOG_MOD === "DEBUG") this.LOG(`[DEBUG] - ${MESSAGE}`);
  }
}

module.exports = LOGGER;
