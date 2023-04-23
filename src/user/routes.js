const router = require("express").Router();

const middleware = require("../common/middleware");
const controller = require("./controller");

const { wrapMidd } = require("../common/helpers");

router.get("/", middleware.getDbClient, wrapMidd(controller.getUsers));
router.get("/:id", middleware.getDbClient, wrapMidd(controller.getUserById));
router.post(
  "/",
  middleware.verifyAccessToken,
  middleware.allowOnlyTheseRoles(["admin"]),
  middleware.getDbClient,
  wrapMidd(middleware.fileUploadHandler, { disconnectFromDb: false }),
  wrapMidd(controller.createUser)
);
router.put(
  "/:id",
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
  "/:id/update",
  middleware.verifyAccessToken,
  middleware.allowOnlyTheseRoles(["admin"]),
  middleware.getDbClient,
  wrapMidd(middleware.fileUploadHandler, { disconnectFromDb: false }),
  wrapMidd(controller.updateUser)
);
router.delete(
  "/:id",
  middleware.verifyAccessToken,
  middleware.allowOnlyTheseRoles(["admin"]),
  middleware.getDbClient,
  wrapMidd(controller.deleteUser)
);

module.exports = router;
