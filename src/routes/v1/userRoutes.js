const UserController = require("../../controller/v1/user");
const ROUTER = require("../../config/ROUTER/v1/ROUTER");

const userRouter = new ROUTER();
const user = new UserController();

// Use proper HTTP methods for the respective routes
userRouter.router.post("/create", user.createUserApi); // Create user
userRouter.router.get("/read/:user_id", user.getUser); // Get user by ID, should use a parameter
userRouter.router.put("/update", user.updateUser); // Use PUT for updating user
userRouter.router.delete("/delete/:user_id", user.deleteUser); // Delete user by ID, should use a parameter
userRouter.router.put("/update/password", user.updatePassword); // Use PUT for updating password

module.exports = { userRouter };
