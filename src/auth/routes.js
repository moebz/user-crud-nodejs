const router = require("express").Router();

const authController = require("./controller");

const { wrapMidd } = require("../common/helpers");

router.post("/login", wrapMidd(authController.login));
router.post("/token/refresh", wrapMidd(authController.doRefreshToken));

module.exports = router;
