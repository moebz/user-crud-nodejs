const router = require("express").Router();

const authRoutes = require("./auth/routes");
const userRoutes = require("./user/routes");

router.get("/ping", (req, res) => {
  console.log("ping");
  return res.send("ping response");
});
router.use("/", authRoutes);
router.use("/users", userRoutes);

module.exports = router;
