const express = require("express");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const LOGGER = require("./src/config/LOGGER/v1/LOGGER");
const { router } = require("./src/routes/v1/index");
const DATABASE = require("./src/config/DATABASE/v1/DATABASE");
const SYSTEM = require("./src/controller/v1/system");

dotenv.config();

// Validate required environment variables
const REQUIRED_ENV_VARS = ["PORT", "LOG_FILE_NAME", "DB_URI", "JWT_SECRET"];
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.error(`ERROR: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

class MAIN extends LOGGER {
  constructor(PORT, LOG_FILE_NAME, LOG_LEVEL) {
    super(LOG_FILE_NAME, LOG_LEVEL);
    this.PORT = PORT;
    this.SYS = new SYSTEM();
    this.APP = express();

    // Middleware setup
    this.APP.use(cors()); // Enable CORS
    this.APP.use(limiter); // Apply rate limiting
    this.APP.use(express.json());
    this.APP.use(express.urlencoded({ extended: true }));
    this.APP.use(express.static(path.join(__dirname, "public")));

    // Root route
    this.APP.get("/", this.handleRootRequest.bind(this));
  }

  // Handle root route requests
  async handleRootRequest(req, res) {
    try {
      this.INFO(`SERVICE REQUEST AT ROOT FROM IP ADDRESS ${req.ip}`);
      this.DEBUG(`Request Received: ${JSON.stringify(req.body)}`);

      const resp = {
        respCode: 200,
        status: "SUCCESS",
        isoRespCode: "00",
        message: "API SERVICE IS WORKING",
      };

      this.INFO(`Response Sent: ${JSON.stringify(resp)}`);
      res.status(200).json(resp);
    } catch (e) {
      this.ERROR(`Error occurred: ${e.message}`);
      res.status(500).json({
        status: "FAILURE",
        message: "API SERVICE IS FACING SOME ISSUE",
        error: e.message,
      });
    }
  }

  // Start the server
  LISTEN() {
    try {
      const file = fs.readFileSync("package.json", "utf8");
      const data = JSON.parse(file);

      this.APP.listen(this.PORT, () => {
        this.INFO(`
>> ${data.name}
>> ${data.description}
>> AUTHOR: ${data.author}
>> VERSION: ${data.version}
>> API SERVICE STARTED ON PORT ${this.PORT}
        `);
      });
    } catch (e) {
      this.ERROR(`Failed to read package.json or start server: ${e.message}`);
      process.exit(1);
    }
  }
}

// Initialize and start the application
const APP = new MAIN(process.env.PORT, process.env.LOG_FILE_NAME, LOGGER.LEVEL.DEBUG);
APP.APP.use(router); // Attach routes
APP.LISTEN(); // Start the server

module.exports = { app: APP.APP };