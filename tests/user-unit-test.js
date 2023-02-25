const proxyquire = require("proxyquire").noCallThru();
const httpStatus = require("http-status");
const chai = require("chai");
const sinon = require("sinon");

const { expect } = chai;
require("dotenv").config();

// console.log({ nodeEnv: process.env.NODE_ENV });
const { db } = require("../database");
const { wrapMidd } = require("../helpers");
const { getUserById, createUser } = require("../controller");
const helpers = require("../helpers");

describe("Unit: UserController", () => {
  describe("createUser", () => {
    let getClientStub;
    let client;
    let releaseStub;
    let queryStub;
    let res;
    let statusStub;
    let sendStub;
    let jsonStub;

    beforeEach(async () => {
      // db client setup
      // TODO: can this be simplified?

      client = {
        release: () => {},
        query: () => {},
      };

      getClientStub = sinon.stub(db, "getClient");

      releaseStub = sinon.spy(client, "release");

      getClientStub.returns(client);

      // response setup

      res = {
        status() {},
        json() {},
        send() {},
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

    it("Should register a user", async () => {
      // db data setup

      const mockUser = {
        firstname: "unittestIago",
        lastname: "unittestHedderly",
        email: "unittestihedderlyrr@upenn.edu",
        username: "unittestihedderlyrr",
        passwd: "unittest665nfsf",
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
        dbClient: client,
      };

      // call to createUser

      const wrappedMiddleware = wrapMidd(createUser);

      await wrappedMiddleware(req, res);

      // console.log({ sendStub: sendStub.getCall(0).args });

      // expects

      expect(
        hashPasswordStub.calledOnceWithExactly(mockUser.passwd)
      ).to.be.equal(true);
      expect(queryStub.calledOnce).to.be.equal(true);
      expect(statusStub.calledOnceWithExactly(httpStatus.CREATED)).to.be.equal(
        true
      );
      expect(
        sendStub.calledOnceWithExactly({
          message: `User added with ID: ${insertedId}`,
        })
      ).to.be.equal(true);
      expect(releaseStub.calledOnce).to.be.equal(true);
    });

    it("Should not register a user that is sending more than one image", async () => {
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

      const mRes = {
        status: sinon.stub().returnsThis(),
        send: sinon.spy(),
      };

      const next = sinon.spy();

      const { fileUploadHandler } = proxyquire("../middleware", {
        // eslint-disable-next-line global-require
        multer: require("./mocks/multerMockForUnexpectedFile"),
      });

      fileUploadHandler(req, mRes, next);

      expect(
        mRes.status.calledOnceWithExactly(httpStatus.BAD_REQUEST)
      ).to.be.equal(true);
      expect(
        mRes.send.calledOnceWithExactly({
          message: "An unknown error occurred",
        })
      ).to.be.equal(true);
    });

    it("Should not register a user when password is not provided", async () => {
      // db data setup

      const mockUser = {
        firstname: "unittestIago",
        lastname: "unittestHedderly",
        email: "unittestihedderlyrr@upenn.edu",
        username: "unittestihedderlyrr",
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
        dbClient: client,
      };

      // call to createUser

      const wrappedMiddleware = wrapMidd(createUser);

      await wrappedMiddleware(req, res);

      // expects

      expect(queryStub.notCalled).to.be.equal(true);
      expect(
        statusStub.calledOnceWithExactly(httpStatus.BAD_REQUEST)
      ).to.be.equal(true);
      expect(
        sendStub.calledOnceWithExactly({
          message: "Username and password are required",
        })
      ).to.be.equal(true);
      // console.log('passwordNotProvided.releaseStub.calledTimes', releaseStub.getCalls());
      expect(releaseStub.calledOnce).to.be.equal(true);
    });
  });

  describe("getUserById", () => {
    let getClientStub;
    let client;
    let releaseStub;
    let queryStub;
    let res;
    let statusStub;
    let sendStub;
    let jsonStub;

    beforeEach(async () => {
      // db client setup
      // TODO: can this be simplified?

      client = {
        release: () => {},
        query: () => {},
      };

      getClientStub = sinon.stub(db, "getClient");

      releaseStub = sinon.spy(client, "release");

      getClientStub.returns(client);

      // client = await db.getClient();

      // response setup

      res = {
        status() {},
        json() {},
        send() {},
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
      sendStub.restore();
    });

    it("Should get user by id", async () => {
      // user data setup

      const idToSearch = 1000;
      const mockUser = {
        id: idToSearch,
        firstname: "unittestIago",
        lastname: "unittestHedderly",
        email: "unittestihedderlyrr@upenn.edu",
        username: "unittestihedderlyrr",
        passwd: "unittest665nfsf",
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
        dbClient: client,
      };

      // get user call

      const wrappedMiddleware = wrapMidd(getUserById);

      await wrappedMiddleware(req, res);

      // expects

      // expect(getClientStub.calledOnce).to.be.equal(true);
      expect(queryStub.calledOnce).to.be.equal(true);
      expect(statusStub.calledOnceWithExactly(httpStatus.OK)).to.be.equal(true);
      expect(
        jsonStub.calledOnceWithExactly({
          data: mockDbRows,
          message: null,
        })
      ).to.be.equal(true);
      expect(releaseStub.calledOnce).to.be.equal(true);
    });
  });
});
