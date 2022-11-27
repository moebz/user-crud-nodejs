const express = require('express');
const bodyParser = require('body-parser');
// const cors = require('cors');
require('dotenv').config();
const routes = require('./routes');

const app = express();

const port = 4000;

// app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  '/',
  routes,
);

// Error handler.
// DO NOT remove 'next' parameter.
app.use((error, req, res, next) => {
  res.status(500);
  res.json({
    message: error.message,
  });
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})
