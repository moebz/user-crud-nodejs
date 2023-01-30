const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const { faker } = require("@faker-js/faker");
const { getUserById } = require("../controller.js");
const { db } = require("../database.js");

describe("User route", function () {
  let fakeClient = {
    connect: () => {},
    release: () => {},
    query: () => {},
  };

  it("Should get user by id", async function () {
    const getClientStub = sinon.stub(db, "getClient").returns(fakeClient);

    const idToSearch = 1000;
    const userData = {
      id: idToSearch,
      firstname: "testIago",
      lastname: "testHedderly",
      email: "testihedderlyrr@upenn.edu",
      username: "testihedderlyrr",
      passwd: "test665nfsf",
      avatar_url: null,
    };
    const rows = [userData];

    const req = {
      params: {
        id: idToSearch,
      },
    };
    const res = { status: function () {}, json: function () {} };

    const client = await db.getClient();

    const connectStub = sinon.stub(client, "connect").returns(fakeClient);

    const queryStub = sinon.stub(client, "query").returns({
      rows: rows,
    });

    const statusStub = sinon.stub(res, "status").returns(res);

    const jsonStub = sinon.spy(res, "json");

    await getUserById(req, res);

    expect(connectStub.calledOnce);
    expect(queryStub.calledOnce);
    expect(statusStub.calledOnceWithExactly(200));
    expect(
      jsonStub.calledOnceWithExactly({
        data: rows,
        code: null,
        message: null,
      })
    );
  });
});
