const { expect } = require("chai");
const request = require("supertest");
const httpStatus = require("http-status");
const app = require("../index");
const helpers = require("../helpers");

async function postUser(req, userToken) {
  const { body } = await request(app)
    .post("/users")
    .set("user-token", userToken)
    .send(req)
    .expect(httpStatus.CREATED);
  return body;
}

// console.log = function () {};

require("dotenv").config();

const { NODE_ENV } = process.env;

if (NODE_ENV !== "test") {
  throw new Error(
    "Aborting. NODE_ENV isn't 'test'. Code may point to the wrong database. Was dotenv required and config()-ed? Does  package.json have a test script that sets NODE_ENV to 'test'?"
  );
}

const { db } = require("../database");

describe("Integration: UserController", () => {
  let client;
  let userToken;
  let existingTestUserAndPassword;

  before("Load app", async () => {
    client = await db.getClient();
  });

  before("Insert user to perform login later", async () => {
    const testUserToInsert = {
      username: "theTestUser",
      passwd: "123456",
    };

    const passwordHash = await helpers.hashPassword(testUserToInsert.passwd);

    // ON CONFLICT DO NOTHING = if the user already exists, don't throw an error.
    await client.query(
      `INSERT INTO user_account (
        firstname,
        lastname,
        email,
        username,
        passwd,
        avatar_url
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      ) ON CONFLICT DO NOTHING RETURNING *`,
      [null, null, null, testUserToInsert.username, passwordHash, null]
    );

    existingTestUserAndPassword = testUserToInsert;
  });

  beforeEach("Login to get auth token", async () => {
    const req = existingTestUserAndPassword;
    const { body } = await request(app).post("/login").send(req);
    userToken = body.data.userToken;
  });

  describe("POST /users", () => {
    it("Should create a new user", async () => {
      const uniqueUsername = `user${Date.now()}`;

      const req = {
        firstname: "integration test user 1",
        username: uniqueUsername,
        passwd: "123456",
      };
      await postUser(req, userToken);

      const { rows } = await client.query(
        "SELECT firstname, username FROM user_account WHERE username = $1",
        [req.username]
      );

      expect(rows).lengthOf(1);

      expect(rows[0]).to.deep.equal({
        firstname: req.firstname,
        username: req.username,
      });
    });

    it("Should not register a user that is sending more than one image", async () => {
      const mockUser = {
        firstname: "integrationtestIago",
        lastname: "testHedderly",
        email: "testihedderlyrr@upenn.edu",
        username: "testihedderlyrr",
        passwd: "test665nfsf",
      };

      const res = await request(app)
        .post("/users")
        .set("Accept", "application/json; charset=utf-8")
        .set("user-token", userToken)
        .field("Content-Type", "multipart/form-data")
        .field("firstname", mockUser.firstname)
        .field("lastname", mockUser.lastname)
        .field("email", mockUser.email)
        .field("username", mockUser.username)
        .field("passwd", mockUser.passwd)
        .attach("avatar", "tests/files/cat.png")
        .attach("avatar2", "tests/files/cat.png");

      expect(res.status).to.equal(httpStatus.BAD_REQUEST);
    });

    it("Should register a user that is sending one image", async () => {
      const uniqueUsername = `user${Date.now()}`;
      const uniqueEmail = `testihedderlyrr${Date.now()}@upenn.edu`;

      const mockUser = {
        firstname: "integrationtestIago",
        lastname: "testHedderly",
        email: uniqueEmail,
        username: uniqueUsername,
        passwd: "test665nfsf",
      };

      const res = await request(app)
        .post("/users")
        .set("Accept", "application/json; charset=utf-8")
        .set("user-token", userToken)
        .field("Content-Type", "multipart/form-data")
        .field("firstname", mockUser.firstname)
        .field("lastname", mockUser.lastname)
        .field("email", mockUser.email)
        .field("username", mockUser.username)
        .field("passwd", mockUser.passwd)
        .attach("avatar", "tests/files/cat.png");

      expect(res.status).to.equal(httpStatus.CREATED);
    });
  });
});
