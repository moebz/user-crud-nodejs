const router = require("express").Router();

const middleware = require("../common/middleware");
const authController = require("./controller");

const { wrapMidd } = require("../common/helpers");

router.post("/login", middleware.getDbClient, wrapMidd(authController.login));
router.post(
  "/token/refresh",
  middleware.getDbClient,
  wrapMidd(authController.doRefreshToken)
);

module.exports = router;
