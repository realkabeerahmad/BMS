const express = require("express");
const LOGGER = require("../../utils/LOGGER/v1/logger");

class ROUTER extends LOGGER {
  constructor() {
    super(process.env.LOGS_FILE_PATH, process.env.LOG_LEVEL);
    this.router = express.Router();
  }
}

module.exports = ROUTER;
