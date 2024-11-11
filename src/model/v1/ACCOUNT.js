const DATABASE = require("../../DATABASE/v1/DATABASE");
const LOGGER = require("../../logger/v1/logger");

class ACCOUNT extends ({ LOGGER, DATABASE }) {
  constructor(ACCOUNT_NO, ROUTING_NO, BRANCH_CODE, ACCOUNT_TITLE) {
    super();
  }
}
