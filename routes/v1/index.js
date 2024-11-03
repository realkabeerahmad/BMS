const ROUTER = require("./ROUTER");
const { userRouter } = require("./userRoutes");

const router = new ROUTER();

// Use a proper path for the user routes
router.router.use("/BMSJSONHANDLER/v1/user", userRouter.router);

module.exports = { router: router.router };
