const SYSTEM = require("../../src/controller/v1/system");
const ROUTER = require("./ROUTER");
const { userRouter } = require("./userRoutes");

const router = new ROUTER();

// Use a proper path for the user routes
router.router.use("/BMSJSONHANDLER/v1/user", userRouter.router);
router.router.use("/BMSJSONHANDLER/v1/cacheRefresher", SYSTEM.hardRefresh);

module.exports = { router: router.router };
