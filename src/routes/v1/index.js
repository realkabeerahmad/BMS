const SYSTEM = require("../../controller/v1/system");
const ROUTER = require("../../config/ROUTER/v1/ROUTER");
const { userRouter } = require("./userRoutes");
const AUTH = require("../../config/AUTH/v1/AUTH");

const router = new ROUTER();
const auth = new AUTH();

// Use a proper path for the user routes
router.router.use("/BMSJSONHANDLER/v1/user", userRouter.router);
router.router.use("/BMSJSONHANDLER/v1/cacheRefresher", SYSTEM.hardRefresh);

// Login route with proper error handling and async/await
router.router.get("/BMSJSONHANDLER/v1/login/:user_id/:password", async (req, res) => {
  try {
    const { user_id, password } = req.params;

    // Validate input
    if (!user_id || !password) {
      return res.status(400).json({
        responseCode: "400",
        message: "Missing user_id or password",
      });
    }

    // Call the login method from the AUTH class
    await auth.login(req, res);
  } catch (error) {
    // Log the error and return a 500 response
    auth.ERROR(`Login route error: ${error.message}`);
    res.status(500).json({
      responseCode: "500",
      message: "Internal Server Error",
    });
  }
});

module.exports = { router: router.router };