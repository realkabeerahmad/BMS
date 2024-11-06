const DATABASE = require("../../DATABASE/v1/DATABASE");
const LOGGER = require("../../logger/v1/logger");
const jwt = require("jsonwebtoken");

class AUTH extends LOGGER {
  static queries = {
    READ: "SELECT * FROM USER_SESSIONS WHERE user_id = $1 AND token = $2 ORDER BY session_id DESC",
    UPDATE: "UPDATE USER_SESSIONS SET is_expired = TRUE WHERE session_id = $1",
  };
  constructor() {
    super("/auth/auth.log", LOGGER.LEVEL.DEBUG);
    this.DB = new DATABASE("/auth/auth.log");
  }

  // Generates a JWT token for the given user
  async generateToken(user) {
    this.INFO("Generating token for user " + user.user_id);

    const payload = {
      userId: user.user_id,
      roleId: user.role_id,
    };

    const options = {
      expiresIn: "1h",
    };

    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, options);

    // Record the token in USER_SESSIONS table
    await this.saveSession(user.user_id, token);

    return token;
  }

  // Middleware to authenticate the JWT token from request headers
  authenticateToken = async (req, res, next) => {
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

      const sessions = await this.DB.CONNECTION.query(AUTH.queries.READ, [
        decodedUser.userId,
        token,
      ]);

      this.DEBUG(
        "Sessions retrieved from database for user " + decodedUser.userId
      );

      if (sessions.length > 0) {
        const session = sessions[0];
        const now = new Date();

        if (session.session_time < now) {
          if (!session.is_expired) {
            await this.DB.CONNECTION.query(AUTH.queries.UPDATE, [
              session.session_id,
            ]);
          }
          return res.status(200).json({
            message: "Session Timeout: Please login again",
          });
        } else if (session.is_expired) {
          return res.status(200).json({
            message: "Session Expired: Please login again",
          });
        }
      }

      req.user = decodedUser;
      next();
    });
  };

  getSessions = async (user_id) => {
    this.INFO("Retrieve the latest session for the user");
    const sessions = await this.DB.CONNECTION.query(
      "SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY session_id DESC LIMIT 1",
      [user_id]
    );
    return sessions;
  };

  login = async (req, res, next) => {
    const { user_id, password } = req.body;
    this.INFO("Going to execute the Login Flow");
    this.DEBUG(`Data Received in request -> , ${user_id}, ${password}`);
    const sessions = this.getSessions(user_id);
    if (
      sessions.length > 0 &&
      sessions[0]?.session_time > new Date() &&
      !sessions[0]?.is_expired
    ) {
      this.INFO("User already logged in");
      return res
        .status(200)
        .json({ message: "User already logged in", session: sessions[0] });
    }
    try {
    } catch (error) {}
  };
  // Saves session details to the USER_SESSIONS table
  async saveSession(userId, token) {
    const sessionTime = new Date();
    sessionTime.setHours(sessionTime.getHours() + 1); // Set expiration for 1 hour

    await db.query(
      "INSERT INTO USER_SESSIONS (user_id, token, session_time, is_expired) VALUES ($1, $2, $3, $4)",
      [userId, token, sessionTime, false]
    );

    this.INFO(
      `Session created for user ${userId} with expiration at ${sessionTime}`
    );
  }
}

module.exports = { AUTH };
