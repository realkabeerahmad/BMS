const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const LOGGER = require("./logger/v1/logger");
const { router } = require("./routes/v1/index");
const DATABASE = require("./DATABASE/v1/DATABASE");
const SYSTEM = require("./controller/v1/system");

dotenv.config();

class MAIN extends LOGGER {
  constructor(PORT, LOG_FILE_NAME, LOG_LEVEL) {
    super(LOG_FILE_NAME, LOG_LEVEL);
    this.PORT = PORT;
    this.SYS = new SYSTEM();
    this.APP = express();
    this.APP.use(express.json());
    this.APP.use(express.urlencoded({ extended: true }));
    this.APP.use(express.static(path.join(__dirname, "public")));
    this.APP.get("/", async (req, res) => {
      try {
        this.INFO(`SERVICE REQUEST AT ROOT FROM IP ADDRESS ${req.ip}`);
        // Log the received request body
        this.DEBUG(`Request Received: ${JSON.stringify(req.body)}`);

        // Prepare the response object
        const resp = {
          respCode: 200,
          status: "SUCCESS",
          isoRespCode: "00",
          message: "API SERVICE IS WORKING",
          // demoTransactionData: demo,
        };

        // Log the response and send it back
        this.INFO(`Response Sent: ${JSON.stringify(resp)}`);
        res.status(200).json(resp);
      } catch (e) {
        // Log the error and send a failure response
        this.ERROR(`Error occurred: ${e.message}`);
        res.status(500).json({
          status: "FAILURE",
          message: "API SERVICE IS FACING SOME ISSUE",
          error: e.message,
        });
      }
    });
  }
  LISTEN() {
    this.APP.listen(this.PORT, () => {
      this.INFO(
        `
>>BANK MANAGEMENT SYSTEM
>>AUTHOR: AKA
>>VERSION: 0.0.1
>>API SERVIC STARTED ON PORT ${this.PORT}`
      );
    });
  }
}

const APP = new MAIN(
  process.env.PORT,
  process.env.LOG_FILE_NAME,
  LOGGER.LEVEL.DEBUG
);
APP.APP.use(router);
APP.LISTEN();

module.exports = { app: APP.APP };
