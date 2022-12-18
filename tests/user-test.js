const { expect } = require("chai");
const request = require("supertest");
const Pool = require("pg-pool");

require("dotenv").config();

const {
  RDB_USER,
  RDB_HOST,
  RDB_NAME,
  RDB_PASSWORD,
  RDB_PORT,
  JWT_SECRET,
  JWT_EXPIRATION,
} = process.env;

describe("User route", function () {
  let app;
  let pool;
  let authToken;

  before("Mock db connection and load app", async function () {
    // Create a new pool with a connection limit of 1

    pool = new Pool({
      user: RDB_USER,
      host: RDB_HOST,
      database: RDB_NAME,
      password: RDB_PASSWORD,
      port: RDB_PORT,
      max: 1, // Reuse the connection to make sure we always hit the same temporal schema
      idleTimeoutMillis: 0, // Disable auto-disconnection of idle clients to make sure we always hit the same temporal schema
    });

    // // Mock the query function to always return a connection from the pool we just created
    // client.query = (text, values) => {
    //   return pool.query(text, values);
    // };

    // It's important to import the app after mocking the database connection
    app = require("./../index");
  });

  beforeEach("Create temporary tables", async function () {
    await pool.query(
      "CREATE TEMPORARY TABLE pg_temp.user_account (LIKE user_account INCLUDING ALL)"
    ); // This will copy constraints also
  });

  beforeEach("Insert fake data", async function () {
    await pool.query(
      "INSERT INTO pg_temp.user_account (username, passwd) VALUES ('admin', '$2b$10$axTwH7BuLDBOSeZ9WfDQ7u28FhBkdunR.Fql.bcJ8dVj./E8aY2Z2')"
    );
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

  afterEach("Drop temporary tables", async function () {
    await pool.query("DROP TABLE IF EXISTS pg_temp.user_account");
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
        "SELECT username FROM pg_temp.user_account WHERE username = $1",
        [req.username]
      );

      expect(rows).lengthOf(1);

      expect(rows[0]).to.deep.equal(req);
    });

    // it("Should fail if name already exists", async function () {
    //   const req = {
    //     name: "note1",
    //     content: "content1",
    //   };
    //   await postNote(req);
    //   await postNote(req, 400); // Second request should fail
    // });

    // it("Should fail if request is missing required params", async function () {
    //   await postNote({ name: "note1" }, 400);
    //   await postNote({ content: "content1" }, 400);
    //   await postNote({}, 400);
    // });
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
