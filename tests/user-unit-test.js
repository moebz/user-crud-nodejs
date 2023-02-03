const httpStatus = require("http-status");
const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const { faker } = require("@faker-js/faker");
const { getUserById, createUser } = require("../controller.js");
const { db } = require("../database.js");

describe("UserController", function () {
  describe("createUser", function () {
    it("Should register a user", async function () {
      // db client setup
      // TODO: can this be simplified?

      const fakeClient = {
        release: () => {},
        query: () => {},
      };

      const getClientStub = sinon.stub(db, "getClient").returns(fakeClient);

      const client = await db.getClient();

      const releaseStub = sinon.spy(client, "release");

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

      const queryStub = sinon.stub(client, "query").returns(mockQueryResult);

      // request setup

      const req = {
        body: mockUser,
      };

      // response setup

      const res = {
        status: function () {},
        send: function () {},
      };

      const statusStub = sinon.stub(res, "status").returns(res);

      const sendStub = sinon.spy(res, "send");

      // call to createUser

      await createUser(req, res);

      console.log({ sendStub: sendStub.getCall(0).args });

      // expects

      expect(queryStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWithExactly(httpStatus.CREATED)).to.be.true;
      expect(
        sendStub.calledOnceWithExactly({
          message: `User added with ID: ${insertedId}`,
        })
      ).to.be.true;
      expect(releaseStub.calledOnce).to.be.true;

      // clean up

      getClientStub.restore();
      queryStub.restore();
    });

    it("Should not register a user when username is not provided", async function () {
      // db client setup
      // TODO: can this be simplified?

      const fakeClient = {
        release: () => {},
        query: () => {},
      };

      const getClientStub = sinon.stub(db, "getClient").returns(fakeClient);

      const client = await db.getClient();

      const releaseStub = sinon.spy(client, "release");

      // db data setup

      const mockUser = {
        firstname: "testIago",
        lastname: "testHedderly",
        email: "testihedderlyrr@upenn.edu",
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

      const queryStub = sinon.stub(client, "query").returns(mockQueryResult);

      // request setup

      const req = {
        body: mockUser,
      };

      // response setup

      const res = {
        status: function () {},
        send: function () {},
      };

      const statusStub = sinon.stub(res, "status").returns(res);

      const sendStub = sinon.spy(res, "send");

      // call to createUser

      await createUser(req, res);

      console.log({ queryStubCalls: queryStub.getCalls() });

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

      // clean up

      getClientStub.restore();
      queryStub.restore();
      releaseStub.restore();
    });

    it("Should not register a user when password is not provided", async function () {
      // db client setup
      // TODO: can this be simplified?

      const fakeClient = {
        release: () => {},
        query: () => {},
      };

      const getClientStub = sinon.stub(db, "getClient").returns(fakeClient);

      const client = await db.getClient();

      const releaseStub = sinon.spy(client, "release");

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

      const queryStub = sinon.stub(client, "query").returns(mockQueryResult);

      // request setup

      const req = {
        body: mockUser,
      };

      // response setup

      const res = {
        status: function () {},
        send: function () {},
      };

      const statusStub = sinon.stub(res, "status").returns(res);

      const sendStub = sinon.spy(res, "send");

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

      // clean up

      getClientStub.restore();
      queryStub.restore();
      releaseStub.restore();
    });
  });

  describe("getUserById", function () {
    it("Should get user by id", async function () {
      // db client setup
      // TODO: can this be simplified?

      const fakeClient = {
        release: () => {},
        query: () => {},
      };

      const getClientStub = sinon.stub(db, "getClient").returns(fakeClient);

      const client = await db.getClient();

      const releaseStub = sinon.spy(client, "release");

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

      const queryStub = sinon.stub(client, "query").returns(mockQueryResult);

      // request setup

      const req = {
        params: {
          id: idToSearch,
        },
      };

      // response setup

      const res = { status: function () {}, json: function () {} };

      const statusStub = sinon.stub(res, "status").returns(res);

      const jsonStub = sinon.spy(res, "json");

      // get user call

      await getUserById(req, res);

      // expects

      expect(queryStub.calledOnce).to.be.true;
      expect(statusStub.calledOnceWithExactly(200)).to.be.true;
      expect(
        jsonStub.calledOnceWithExactly({
          data: mockDbRows,
          code: null,
          message: null,
        })
      ).to.be.true;
      expect(releaseStub.calledOnce).to.be.true;

      // clean up

      getClientStub.restore();
      queryStub.restore();
      statusStub.restore();
      jsonStub.restore();
      releaseStub.restore();
    });
  });
});
