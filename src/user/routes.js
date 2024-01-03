const router = require("express").Router();

const middleware = require("../common/middleware");
const controller = require("./controller");

const { wrapMidd } = require("../common/helpers");

router.get("/", wrapMidd(controller.getUsers));

router.get("/:id", wrapMidd(controller.getUserById));
router.post(
  "/",
  // middleware.verifyAccessToken,
  // middleware.allowOnlyTheseRoles(["admin"]),
  wrapMidd(middleware.fileUploadHandler),
  wrapMidd(controller.createUser)
);
router.put(
  "/:id",
  // middleware.verifyAccessToken,
  // middleware.allowOnlyTheseRoles(["admin"]),
  wrapMidd(middleware.fileUploadHandler),
  wrapMidd(controller.updateUser)
);
// POST route to be able to update
// receiving multipart form data
// with a file. (Axios can't send
// multipart form data in put nor patch)
router.post(
  "/:id/update",
  // middleware.verifyAccessToken,
  // middleware.allowOnlyTheseRoles(["admin"]),
  wrapMidd(middleware.fileUploadHandler),
  wrapMidd(controller.updateUser)
);
router.delete(
  "/:id",
  // middleware.verifyAccessToken,
  // middleware.allowOnlyTheseRoles(["admin"]),
  wrapMidd(controller.deleteUser)
);

module.exports = router;
