/* eslint-disable no-console */

// In case it wasn't called outside
require("dotenv").config();

const {
  RDB_USER,
  RDB_HOST,
  RDB_NAME,
  TEST_RDB_NAME,
  RDB_PASSWORD,
  RDB_PORT,
  NODE_ENV,
} = process.env;

const knex = require("knex")({
  client: "pg",
  connection: {
    host: RDB_HOST,
    port: RDB_PORT,
    user: RDB_USER,
    database: RDB_NAME,
    password: RDB_PASSWORD,
    ssl: false,
  },
});

module.exports = { knex };
