const { expect } = require("chai");
const request = require("supertest");

require("dotenv").config();

describe("User route", function () {
  let app;
  let pool;
  let userToken;

  before("Load app", async function () {
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
