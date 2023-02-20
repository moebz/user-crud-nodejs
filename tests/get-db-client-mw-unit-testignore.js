const proxyquire = require("proxyquire").noCallThru();
const httpStatus = require("http-status");
const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
require("dotenv").config();
console.log({ nodeEnv: process.env.NODE_ENV });
const { db } = require("../database");
const { getDbClient } = require("../middleware");
const { getUserById, createUser } = require("../controller");
const helpers = require("../helpers");

describe("get db client middleware", function () {
  let getClientStub,
    client,
    releaseStub,
    queryStub,
    res,
    statusStub,
    sendStub,
    jsonStub,
    nextStub;

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

    getClientStub?.restore?.();
    queryStub?.restore?.();
    statusStub?.restore?.();
    jsonStub?.restore?.();
    sendStub?.restore?.();
    nextStub?.restore?.();
    releaseStub?.restore?.();
  });

  it("Should set the db client in the request object", async function () {

    nextStub = sinon.spy();
    let req = {};

    await getDbClient(req, res, nextStub);

    expect(getClientStub.calledOnce).to.be.true;
    expect(nextStub.calledOnce).to.be.true;
    expect(req.dbClient === client).to.be.true;
  });
});
