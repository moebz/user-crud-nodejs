require("dotenv").config();

const { NODE_ENV } = process.env;

if (NODE_ENV !== "test") {
  throw new Error(
    "Aborting. NODE_ENV isn't 'test'. Code may point to the wrong database. Was dotenv required and config()-ed? Does package.json have a test script that sets NODE_ENV to 'test'?"
  );
}

// eslint-disable-next-line import/order
const { knex } = require("../../common/database");

const request = require("supertest");
const httpStatus = require("http-status");
const app = require("../../../index");
const { authHelpers } = require("../../auth/helpers");

async function postUser(req, accessToken) {
  const { body } = await request(app)
    .post("/users")
    .set("access-token", accessToken)
    .send(req)
    .expect(httpStatus.CREATED);
  return body;
}

afterAll((done) => {
  // Close app and database connection
  // or else Jest will complain about it
  // at the end of the test.

  // Close the server
  app.close((err) => {
    if (err) {
      console.error(err);
    }

    // Then destroy the knex connection
    knex.destroy(done);
  });
});

describe("Integration: UserController", () => {
  let accessToken;
  let existingTestUserAndPassword;

  // Insert user to perform login later
  beforeAll(async () => {
    const testUserToInsert = {
      username: "theTestUser",
      passwd: "123456",
    };

    const passwordHash = await authHelpers.hashPassword(
      testUserToInsert.passwd
    );

    // .onConflict().ignore(); = if the user already exists, don't throw an error.
    await knex("user_account")
      .insert({
        firstname: null,
        lastname: null,
        email: null,
        username: testUserToInsert.username,
        passwd: passwordHash,
        avatar_url: null,
        role: "admin",
      })
      .onConflict()
      .ignore();

    // Login to get auth token

    existingTestUserAndPassword = testUserToInsert;

    const req = existingTestUserAndPassword;
    const { body } = await request(app).post("/login").send(req);
    accessToken = body.data.accessToken;
  });

  describe("POST /users", () => {
    test("Should create a new user", async () => {
      // Arrange.

      const uniqueUsername = `user${Date.now()}`;

      const req = {
        firstname: "integration test user 1",
        lastname: "integration test user 1",
        email: `fake${new Date().getTime()}@email.com`,
        username: uniqueUsername,
        passwd: "123456",
        passwd_confirmation: "123456",
        role: "standard",
      };

      // Act.

      await postUser(req, accessToken);

      // Assert.

      const rows = await knex("user_account")
        .select("firstname", "username")
        .where("username", req.username);

      expect(rows).toHaveLength(1);

      expect(rows[0]).toEqual({
        firstname: req.firstname,
        username: req.username,
      });
    });

    test("Should not register a user that is sending more than one image", async () => {
      // Arrange.

      const mockUser = {
        firstname: "integrationtestIago",
        lastname: "testHedderly",
        email: "testihedderlyrr@upenn.edu",
        username: "testihedderlyrr",
        passwd: "test665nfsf",
        passwd_confirmation: "test665nfsf",
      };

      // Act.

      const res = await request(app)
        .post("/users")
        .set("Accept", "application/json; charset=utf-8")
        .set("access-token", accessToken)
        .set("Content-Type", "multipart/form-data")
        .field("firstname", mockUser.firstname)
        .field("lastname", mockUser.lastname)
        .field("email", mockUser.email)
        .field("username", mockUser.username)
        .field("passwd", mockUser.passwd)
        .field("passwd_confirmation", mockUser.passwd_confirmation)
        .field("role", "standard")
        .attach("avatar", "tests/files/cat.png")
        .attach("avatar2", "tests/files/cat.png");

      // Assert.

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });

    test("Should register a user that is sending one image", async () => {
      // Arrange.

      const uniqueUsername = `user${Date.now()}`;
      const uniqueEmail = `testihedderlyrr${Date.now()}@upenn.edu`;

      const mockUser = {
        firstname: "integrationtestIago",
        lastname: "testHedderly",
        email: uniqueEmail,
        username: uniqueUsername,
        passwd: "test665nfsf",
        passwd_confirmation: "test665nfsf",
      };

      // Act.

      const res = await request(app)
        .post("/users")
        .set("Accept", "application/json; charset=utf-8")
        .set("access-token", accessToken)
        .set("Content-Type", "multipart/form-data")
        .field("firstname", mockUser.firstname)
        .field("lastname", mockUser.lastname)
        .field("email", mockUser.email)
        .field("username", mockUser.username)
        .field("passwd", mockUser.passwd)
        .field("passwd_confirmation", mockUser.passwd_confirmation)
        .field("role", "standard")
        .attach("avatar", "tests/files/cat.png");

      // Assert.

      expect(res.status).toBe(httpStatus.CREATED);
    });
  });
});
