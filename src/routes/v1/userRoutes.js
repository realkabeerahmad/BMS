const UserController = require("../../controller/v1/user");
const ROUTER = require("../../config/ROUTER/v1/ROUTER");

const userRouter = new ROUTER();
const user = new UserController();

/**
 * Middleware to validate user ID parameter.
 */
const validateUserId = (req, res, next) => {
  const { user_id } = req.params;
  if (!user_id || typeof user_id !== "string") {
    return res.status(400).json({
      responseCode: "400",
      message: "Invalid or missing user_id parameter.",
    });
  }
  next();
};

/**
 * Middleware to validate request body for user creation and updates.
 */
const validateUserBody = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      responseCode: "400",
      message: "Missing required fields: name, email, or password.",
    });
  }
  next();
};

/**
 * Middleware to validate password update request body.
 */
const validatePasswordBody = (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      responseCode: "400",
      message: "Missing required fields: oldPassword or newPassword.",
    });
  }
  next();
};

// Create user route
userRouter.router.post("/create", validateUserBody, async (req, res) => {
  try {
    await user.createUserApi(req, res);
  } catch (error) {
    userRouter.ERROR(`Error in create user route: ${error.message}`);
    res.status(500).json({
      responseCode: "500",
      message: "Internal Server Error",
    });
  }
});

// Get user by ID route
userRouter.router.get("/read/:user_id", validateUserId, async (req, res) => {
  try {
    await user.getUser(req, res);
  } catch (error) {
    userRouter.ERROR(`Error in get user route: ${error.message}`);
    res.status(500).json({
      responseCode: "500",
      message: "Internal Server Error",
    });
  }
});

// Update user route
userRouter.router.put("/update", validateUserBody, async (req, res) => {
  try {
    await user.updateUser(req, res);
  } catch (error) {
    userRouter.ERROR(`Error in update user route: ${error.message}`);
    res.status(500).json({
      responseCode: "500",
      message: "Internal Server Error",
    });
  }
});

// Delete user by ID route
userRouter.router.delete("/delete/:user_id", validateUserId, async (req, res) => {
  try {
    await user.deleteUser(req, res);
  } catch (error) {
    userRouter.ERROR(`Error in delete user route: ${error.message}`);
    res.status(500).json({
      responseCode: "500",
      message: "Internal Server Error",
    });
  }
});

// Update password route
userRouter.router.put("/update/password", validatePasswordBody, async (req, res) => {
  try {
    await user.updatePassword(req, res);
  } catch (error) {
    userRouter.ERROR(`Error in update password route: ${error.message}`);
    res.status(500).json({
      responseCode: "500",
      message: "Internal Server Error",
    });
  }
});

module.exports = { userRouter };