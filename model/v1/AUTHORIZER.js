const LOGGER = require("../../logger/v1/logger");

class AUTORIZER extends LOGGER {
  constructor(AUTHORIZER_ID, AUTHORIZER_USER_ID, AUTHORIZER_PASSWORD) {
    this.super("auth.log", "DEBUG");
    this.AUTHORIZER_ID = AUTHORIZER_ID;
    this.AUTHORIZER_USER_ID = AUTHORIZER_USER_ID;
    this.AUTHORIZER_PASSWORD = AUTHORIZER_PASSWORD;
  }
}

module.exports = AUTORIZER;
