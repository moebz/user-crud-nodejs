const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const { faker } = require("@faker-js/faker");
const { getUserById } = require("../controller.js");
const { db } = require("../database.js");

describe("UserController", function () {
  describe("getUserById", function () {
    it("Should get user by id", async function () {

      // db client setup
      // TODO: can this be simplified?

      const fakeClient = {
        connect: () => {},
        release: () => {},
        query: () => {},
      };

      const getClientStub = sinon.stub(db, "getClient").returns(fakeClient);

      const client = await db.getClient();

      const connectStub = sinon.stub(client, "connect").returns(fakeClient);

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

      expect(connectStub.calledOnce);
      expect(queryStub.calledOnce);
      expect(statusStub.calledOnceWithExactly(200));
      expect(
        jsonStub.calledOnceWithExactly({
          data: mockDbRows,
          code: null,
          message: null,
        })
      );
    });
  });
});
