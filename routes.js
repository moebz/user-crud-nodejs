const router = require("express").Router();

const middleware = require("./middleware");
const controller = require("./controller");

router.get("/ping", (req, res) => {
  console.log("ping");
  return res.send("ping response");
});

router.get("/users", controller.getUsers);
router.get("/users/:id", controller.getUserById);
router.post(
  "/users",
  middleware.verifyUserToken,
  middleware.fileUploadHandler,
  controller.createUser
);
router.post("/login", controller.login);
router.put(
  "/users/:id",
  middleware.verifyUserToken,
  middleware.fileUploadHandler,
  (error, req, res, next) => {
    console.log({error});
  },
  controller.updateUser,
);
router.delete("/users/:id", middleware.verifyUserToken, controller.deleteUser);

module.exports = router;
