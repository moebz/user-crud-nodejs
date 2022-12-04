const router = require("express").Router();

const middleware = require("./middleware");
const controller = require("./controller");

const { wrapMidd } = require("./helpers");

router.get("/ping", (req, res) => {
  console.log("ping");
  return res.send("ping response");
});

router.get("/users", wrapMidd(controller.getUsers));
router.get("/users/:id", wrapMidd(controller.getUserById));
router.post(
  "/users",
  middleware.verifyUserToken,
  wrapMidd(middleware.fileUploadHandler),
  wrapMidd(controller.createUser)
);
router.post("/login", wrapMidd(controller.login));
router.put(
  "/users/:id",
  middleware.verifyUserToken,
  wrapMidd(middleware.fileUploadHandler),
  wrapMidd(controller.updateUser)
);
router.delete("/users/:id", middleware.verifyUserToken, wrapMidd(controller.deleteUser));

module.exports = router;
