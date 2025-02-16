const express = require("express");
const LOGGER = require("../../LOGGER/v1/LOGGER");

module.exports = class ROUTER extends LOGGER {
  constructor() {
    super(process.env.LOGS_FILE_PATH, process.env.LOG_LEVEL);
    this.router = express.Router();
  }
}

