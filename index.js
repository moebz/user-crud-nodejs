const express = require("express");
const bodyParser = require("body-parser");
const {
	StatusCodes,
} = require('http-status-codes');
require("dotenv").config();
const routes = require("./routes");
const NotFoundError = require('./classes/NotFoundError');
const { getErrorHandler } = require('./helpers');

const app = express();
const port = 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", routes);

// Path not found handler
app.use("*", (req, res, next) => {
  next(new NotFoundError(req.path));
});

// Error handler
app.use(getErrorHandler());

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});

module.exports = app;