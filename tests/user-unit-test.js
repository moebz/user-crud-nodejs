const proxyquire = require("proxyquire").noCallThru();
const httpStatus = require("http-status");
const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
require("dotenv").config();
console.log({ nodeEnv: process.env.NODE_ENV });
const { db } = require("../database");
const { getUserById, createUser } = require("../controller");
const helpers = require("../helpers");

describe("Unit: UserController", function () {
  describe("createUser", function () {
    let fakeClient,
      getClientStub,
      client,
      releaseStub,
      queryStub,
      res,
      statusStub,
      sendStub,
      jsonStub;

    beforeEach(async () => {
      // db client setup
      // TODO: can this be simplified?

      fakeClient = {
        release: () => {},
        query: () => {},
      };

      getClientStub = sinon.stub(db, "getClient").returns(fakeClient);

      client = await db.getClient();

      releaseStub = sinon.spy(client, "release");

      // response setup

      res = {
        status: function () {},
        json: function () {},
        send: function () {},
      };

      statusStub = sinon.stub(res, "status").returns(res);
      jsonStub = sinon.spy(res, "json");
      sendStub = sinon.spy(res, "send");
    });

    afterEach(() => {
      // clean up

      getClientStub.restore();
      queryStub.restore();
      statusStub.restore();
      jsonStub.restore();
      releaseStub.restore();
    });

    it("Should register a user", async function () {
      // db data setup

      const mockUser = {
        firstname: "testIago",
        lastname: "testHedderly",
        email: "testihedderlyrr@upenn.edu",
        username: "testihedderlyrr",
        passwd: "test665nfsf",
      };

      const insertedId = 1000;

      const mockDbRows = [
        {
          id: insertedId,
        },
      ];

      const mockQueryResult = {
        rows: mockDbRows,
      };

      queryStub = sinon.stub(client, "query").returns(mockQueryResult);

      // password hash spy

      const hashPasswordStub = sinon.spy(helpers, "hashPassword");

      // request setup

      const req = {
        body: mockUser,
      };

      // call to createUser

      await createUser(req, res);

      console.log({ sendStub: sendStub.getCall(0).args });

      // expects

      expect(hashPasswordStub.calledOnceWithExactly(mockUser.passwd)).to.be
        .true;
      expect(queryStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWithExactly(httpStatus.CREATED)).to.be.true;
      expect(
        sendStub.calledOnceWithExactly({
          message: `User added with ID: ${insertedId}`,
        })
      ).to.be.true;
      expect(releaseStub.calledOnce).to.be.true;
    });

    it("Should not register a user that is sending more than one image", async function () {
      const req = {
        files: [
          {
            originalname: "sample.name",
            mimetype: "sample.type",
            path: "sample.url",
            buffer: Buffer.from("whatever"),
          },
          {
            originalname: "sample.name",
            mimetype: "sample.type",
            path: "sample.url",
            buffer: Buffer.from("whatever"),
          },
        ],
      };

      const res = {
        status: sinon.stub().returnsThis(),
        send: sinon.spy(),
      };

      const next = sinon.spy();

      const { fileUploadHandler } = proxyquire("../middleware", {
        multer: require("./mocks/multerMockForUnexpectedFile"),
      });

      fileUploadHandler(req, res, next);

      expect(res.status.calledOnceWithExactly(httpStatus.BAD_REQUEST)).to.be
        .true;
      expect(
        res.send.calledOnceWithExactly({ message: "An unknown error occurred" })
      ).to.be.true;
    });

    it("Should not register a user when password is not provided", async function () {
      // db data setup

      const mockUser = {
        firstname: "testIago",
        lastname: "testHedderly",
        email: "testihedderlyrr@upenn.edu",
        username: "testihedderlyrr",
      };

      const insertedId = 1000;

      const mockDbRows = [
        {
          id: insertedId,
        },
      ];

      const mockQueryResult = {
        rows: mockDbRows,
      };

      queryStub = sinon.stub(client, "query").returns(mockQueryResult);

      // request setup

      const req = {
        body: mockUser,
      };

      // call to createUser

      await createUser(req, res);

      // expects

      expect(queryStub.notCalled).to.be.true;
      expect(statusStub.calledOnceWithExactly(httpStatus.BAD_REQUEST)).to.be
        .true;
      expect(
        sendStub.calledOnceWithExactly({
          message: "Username and password are required",
        })
      ).to.be.true;
      expect(releaseStub.calledOnce).to.be.true;
    });
  });

  describe("getUserById", function () {
    let fakeClient,
      getClientStub,
      client,
      releaseStub,
      queryStub,
      res,
      statusStub,
      sendStub,
      jsonStub;

    beforeEach(async () => {
      // db client setup
      // TODO: can this be simplified?

      fakeClient = {
        release: () => {},
        query: () => {},
      };

      getClientStub = sinon.stub(db, "getClient").returns(fakeClient);

      client = await db.getClient();

      releaseStub = sinon.spy(client, "release");

      // response setup

      res = {
        status: function () {},
        json: function () {},
        send: function () {},
      };

      statusStub = sinon.stub(res, "status").returns(res);
      jsonStub = sinon.spy(res, "json");
      sendStub = sinon.spy(res, "send");
    });

    afterEach(() => {
      // clean up

      getClientStub.restore();
      queryStub.restore();
      statusStub.restore();
      jsonStub.restore();
      releaseStub.restore();
    });

    it("Should get user by id", async function () {
      // user data setup

      const idToSearch = 1000;
      const mockUser = {
        id: idToSearch,
        firstname: "testIago",
        lastname: "testHedderly",
        email: "testihedderlyrr@upenn.edu",
        username: "testihedderlyrr",
        passwd: "test665nfsf",
        avatar_url: null,
      };
      const mockDbRows = [mockUser];

      const mockQueryResult = {
        rows: mockDbRows,
      };

      queryStub = sinon.stub(client, "query").returns(mockQueryResult);

      // request setup

      const req = {
        params: {
          id: idToSearch,
        },
      };

      // get user call

      await getUserById(req, res);

      // expects

      expect(queryStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWithExactly(httpStatus.OK)).to.be.true;
      expect(
        jsonStub.calledOnceWithExactly({
          data: mockDbRows,
          code: null,
          message: null,
        })
      ).to.be.true;
      expect(releaseStub.calledOnce).to.be.true;
    });
  });
});
