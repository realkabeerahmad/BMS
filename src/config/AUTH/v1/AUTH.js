const DATABASE = require("../../DATABASE/v1/DATABASE");
const LOGGER = require("../../LOGGER/v1/LOGGER");
const jwt = require("jsonwebtoken");

module.exports = class AUTH extends LOGGER {
  static queries = {
    INSERT: "INSERT INTO USER_SESSIONS (user_id, token, session_time, is_expired) VALUES ($1, $2, $3, $4)",
    READ: "SELECT * FROM USER_SESSIONS WHERE user_id = $1 AND token = $2 ORDER BY session_id DESC",
    UPDATE: "UPDATE USER_SESSIONS SET is_expired = TRUE WHERE session_id = $1",
    LATEST_SESSION: `SELECT session_id, session_time, is_expired FROM user_sessions WHERE user_id = $1 ORDER BY session_id DESC LIMIT 1`,
  };

  constructor() {
    super("/auth/auth.log", LOGGER.LEVEL.DEBUG);
  }

  // Generates a JWT token for the given user
  async generateToken(user) {
    try {
      this.INFO(`Generating token for user ${user.user_id}`);

      const payload = {
        userId: user.user_id,
        roleId: user.role_id,
      };

      const options = {
        expiresIn: "1h",
      };

      const secret = process.env.JWT_SECRET || "@12wq33qweee3133w;/;,,sadqw3";
      const token = jwt.sign(payload, secret, options);

      // Record the token in USER_SESSIONS table
      await this.saveSession(user.user_id, token);

      return token;
    } catch (error) {
      this.ERROR(`Unable to generate token: ${error.message}`);
      throw error;
    }
  }

  // Middleware to authenticate the JWT token from request headers
  static authenticateToken = async (req, res, next) => {
    try {
      const authHeader = req.header("Authorization");
      this.DEBUG("Authorization header received for token verification");

      if (!authHeader) {
        return res.status(401).json({
          responseCode: "401",
          message: "Access Denied: Missing Token",
        });
      }

      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.JWT_SECRET, async (err, decodedUser) => {
        if (err) {
          return res.status(403).json({
            responseCode: "403",
            message: "Access Denied: Invalid Token",
          });
        }

        const sessions = await DATABASE.CONNECTION.query(AUTH.queries.READ, [
          decodedUser.userId,
          token,
        ]);

        this.DEBUG(`Sessions retrieved for user ${decodedUser.userId}`);

        if (sessions.length > 0) {
          const session = sessions[0];
          const now = new Date();

          if (session.session_time < now || session.is_expired) {
            if (!session.is_expired) {
              await DATABASE.CONNECTION.query(AUTH.queries.UPDATE, [
                session.session_id,
              ]);
            }
            return res.status(401).json({
              message: "Session Expired: Please login again",
            });
          }
        }

        req.user = decodedUser;
        next();
      });
    } catch (error) {
      this.ERROR(`Unable to authenticate token: ${error.message}`);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  // Retrieve the latest session for the user
  getSessions = async (user_id) => {
    try {
      this.INFO(`Retrieving latest session for user ${user_id}`);
      const result = await DATABASE.CONNECTION.query(AUTH.queries.LATEST_SESSION, [user_id]);
      this.DEBUG(JSON.stringify(result))
      return result || null; // Return the latest session or null if none exists
    } catch (error) {
      this.ERROR(`Unable to get session: ${error.message}`);
      throw error;
    }
  };

  // Login flow
  login = async (req, res) => {
    try {
      const { user_id, password } = req.params;
      this.INFO("Executing login flow");
      this.DEBUG(`Data received: user_id=${user_id}, password=${password}`);

      // Check if the user already has an active session
      const latestSession = await this.getSessions(user_id);
      this.DEBUG(JSON.stringify(latestSession))
      if (latestSession[0] && latestSession[0].session_time > new Date() && !latestSession[0].is_expired) {
        this.INFO("User already logged in");
        return res.status(200).json({
          message: "User already logged in",
          session: latestSession,
        });
      }

      // Validate user credentials (add your logic here)
      const isValidUser = await this.validateUserCredentials(user_id, password);
      if (!isValidUser) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate a new token and session
      const token = await this.generateToken({ user_id, role_id: 1 }); // Replace with actual role_id
      return res.status(200).json({ token });
    } catch (error) {
      this.ERROR(`Login failed: ${error.message}`);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  // Save a new session for the user
  async saveSession(userId, token) {
    try {
      const sessionTime = new Date();
      sessionTime.setHours(sessionTime.getHours() + 1); // Set expiration for 1 hour

      await DATABASE.CONNECTION.query(AUTH.queries.INSERT, [
        userId,
        token,
        sessionTime,
        false,
      ]);

      this.INFO(`Session created for user ${userId} with expiration at ${sessionTime}`);
    } catch (error) {
      this.ERROR(`Unable to save session: ${error.message}`);
      throw error;
    }
  }

  // Validate user credentials (placeholder for actual implementation)
  async validateUserCredentials(user_id, password) {
    // Add your logic to validate user credentials (e.g., check against database)
    return true; // Replace with actual validation
  }
};