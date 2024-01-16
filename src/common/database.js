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

const databaseConfig = {
  user: RDB_USER,
  host: RDB_HOST,
  database: NODE_ENV === "test" ? TEST_RDB_NAME : RDB_NAME,
  password: RDB_PASSWORD,
  port: RDB_PORT,
  ssl: false,
};

const knex = require("knex")({
  client: "pg",
  connection: databaseConfig,
});

module.exports = { knex };
