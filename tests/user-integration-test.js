const { expect } = require("chai");
const request = require("supertest");
const Pool = require("pg-pool");

require("dotenv").config();

const {
  RDB_USER,
  RDB_HOST,
  TEST_RDB_NAME,
  RDB_PASSWORD,
  RDB_PORT,
} = process.env;

describe("User route", function () {
  let app;
  let pool;
  let userToken;

  before("Create a db connection and load app", async function () {
    pool = new Pool({
      user: RDB_USER,
      host: RDB_HOST,
      database: TEST_RDB_NAME,
      password: RDB_PASSWORD,
      port: RDB_PORT,
    });    
    app = require("./../index");
  });

  beforeEach("Login to get auth token", async function () {
    const req = {
      username: "elsalvador",
      passwd: "paiscrypto",
    };
    const { body } = await request(app).post("/login").send(req);
    console.log('body', body);
    userToken = body.data.userToken;
  });

  describe("POST /users", function () {
    it("Should create a new user", async function () {
      const uniqueUsername = `user${Date.now()}`;

      const req = {
        username: uniqueUsername,
        passwd: "123456",
      };
      await postUser(req);

      const { rows } = await pool.query(
        "SELECT username FROM user_account WHERE username = $1",
        [req.username]
      );

      expect(rows).lengthOf(1);

      expect(rows[0]).to.deep.equal({
        username: req.username,
      });
    });
  });

  async function postUser(req) {
    const { body } = await request(app)
      .post("/users")
      .set("user-token", userToken)
      .send(req)
      .expect(201);
    return body;
  }
});
