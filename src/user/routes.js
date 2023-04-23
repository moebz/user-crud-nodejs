const router = require("express").Router();

const middleware = require("../common/middleware");
const authController = require("../auth/controller");
const controller = require("./controller");

const { wrapMidd } = require("../common/helpers");

router.get("/ping", (req, res) => {
  console.log("ping");
  return res.send("ping response");
});
router.post("/login", middleware.getDbClient, wrapMidd(authController.login));
router.post(
  "/token/refresh",
  middleware.getDbClient,
  wrapMidd(authController.doRefreshToken)
);
router.get("/users", middleware.getDbClient, wrapMidd(controller.getUsers));
router.get(
  "/users/:id",
  middleware.getDbClient,
  wrapMidd(controller.getUserById)
);
router.post(
  "/users",
  middleware.verifyAccessToken,
  middleware.allowOnlyTheseRoles(["admin"]),
  middleware.getDbClient,
  wrapMidd(middleware.fileUploadHandler, { disconnectFromDb: false }),
  wrapMidd(controller.createUser)
);
router.put(
  "/users/:id",
  middleware.verifyAccessToken,
  middleware.allowOnlyTheseRoles(["admin"]),
  middleware.getDbClient,
  wrapMidd(middleware.fileUploadHandler, { disconnectFromDb: false }),
  wrapMidd(controller.updateUser)
);
// POST route to be able to update
// receiving multipart form data
// with a file. (Axios can't send
// multipart form data in put nor patch)
router.post(
  "/users/:id/update",
  middleware.verifyAccessToken,
  middleware.allowOnlyTheseRoles(["admin"]),
  middleware.getDbClient,
  wrapMidd(middleware.fileUploadHandler, { disconnectFromDb: false }),
  wrapMidd(controller.updateUser)
);
router.delete(
  "/users/:id",
  middleware.verifyAccessToken,
  middleware.allowOnlyTheseRoles(["admin"]),
  middleware.getDbClient,
  wrapMidd(controller.deleteUser)
);

module.exports = router;
