const router = require("express").Router();

const middleware = require("./middleware");
const controller = require("./controller");

const { wrapMidd } = require("./helpers");

router.get("/ping", (req, res) => {
  console.log("ping");
  return res.send("ping response");
});

router.get("/users", middleware.getDbClient, wrapMidd(controller.getUsers));
router.get(
  "/users/:id",
  middleware.getDbClient,
  wrapMidd(controller.getUserById)
);
router.post(
  "/users",
  middleware.verifyUserToken,
  middleware.getDbClient,
  wrapMidd(middleware.fileUploadHandler, { disconnectFromDb: false }),
  wrapMidd(controller.createUser)
);
router.post("/login", middleware.getDbClient, wrapMidd(controller.login));
router.put(
  "/users/:id",
  middleware.verifyUserToken,
  middleware.getDbClient,
  wrapMidd(middleware.fileUploadHandler, { disconnectFromDb: false }),
  wrapMidd(controller.updateUser)
);
router.delete(
  "/users/:id",
  middleware.verifyUserToken,
  middleware.getDbClient,
  wrapMidd(controller.deleteUser)
);
router.post(
  "/token/refresh",
  middleware.getDbClient,
  wrapMidd(controller.doRefreshToken)
);

module.exports = router;
