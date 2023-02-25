const chai = require("chai");
const sinon = require("sinon");

const { expect } = chai;
require("dotenv").config();

// console.log({ nodeEnv: process.env.NODE_ENV });
const { db } = require("../database");
const { getDbClient } = require("../middleware");

describe("get db client middleware", () => {
  let getClientStub;
  let client;
  let releaseStub;
  let queryStub;
  let res;
  let statusStub;
  let sendStub;
  let jsonStub;
  let nextStub;

  beforeEach(async () => {
    // db client setup
    // TODO: can this be simplified?

    client = {
      release: () => {},
      query: () => {},
    };

    releaseStub = sinon.spy(client, "release");

    getClientStub = sinon.stub(db, "getClient");
    getClientStub.returns(client);

    // response setup

    res = {
      status: () => {},
      json: () => {},
      send: () => {},
    };

    statusStub = sinon.stub(res, "status").returns(res);
    jsonStub = sinon.spy(res, "json");
    sendStub = sinon.spy(res, "send");
  });

  afterEach(() => {
    // clean up

    getClientStub?.restore?.();
    queryStub?.restore?.();
    statusStub?.restore?.();
    jsonStub?.restore?.();
    sendStub?.restore?.();
    nextStub?.restore?.();
    releaseStub?.restore?.();
  });

  it("Should set the db client in the request object", async () => {
    nextStub = sinon.spy();
    const req = {};

    await getDbClient(req, res, nextStub);

    expect(getClientStub.calledOnce).to.be.equal(true);
    expect(nextStub.calledOnce).to.be.equal(true);
    expect(req.dbClient === client).to.be.equal(true);
  });
});
