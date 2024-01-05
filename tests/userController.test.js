const httpStatus = require("http-status");

require("dotenv").config();

const { wrapMidd } = require("../src/common/helpers");

const authHelpers = require("../src/auth/helpers");
const { createUser } = require("../src/user/controller");
const { userModel } = require("../src/user/model");

jest.mock("../src/user/model");
jest.mock("../src/auth/helpers");

describe("Unit: UserController", () => {
  describe("createUser", () => {
    let res;

    beforeEach(async () => {
      // response setup

      res = {
        json: jest.fn(),
        status: jest.fn(() => res),
        send: jest.fn(),
      };
    });

    it("Should register a user", async () => {
      // Arrange.

      const incomingUserData = {
        firstname: "unittestIago",
        lastname: "unittestHedderly",
        email: "unittestihedderlyrr@upenn.edu",
        username: "unittestihedderlyrr",
        passwd: "123456",
        passwd_confirmation: "123456",
        role: "standard",
      };

      const insertedId = 1000;

      const modelCreateResult = {
        id: insertedId,
      };
      userModel.create.mockResolvedValue(modelCreateResult);

      const req = {
        body: incomingUserData,
      };

      // Act.

      const wrappedMiddleware = wrapMidd(createUser);

      await wrappedMiddleware(req, res, (err) => console.log(err));

      // Assert.

      // The hashing function should have been called one time
      // with the provided password.

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(authHelpers.hashPassword).toHaveBeenCalledWith(
        incomingUserData.passwd
      );

      // UserModel.create should have been called one time
      // with an object that contains all original data
      // but passwd_confirmation and passwd (we only store the hash).

      const { passwd, passwd_confirmation, ...expectedCreateParams } =
        incomingUserData;

      expect(userModel.create).toHaveBeenCalledTimes(1);
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining(expectedCreateParams)
      );

      // The controller should send a response with a
      // "created" status code.

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(httpStatus.CREATED);

      // The controller should send a response that contains a field
      // called "message", which is a string that contains the inserted id.

      expect(res.send).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(insertedId.toString()),
        })
      );
    });

    //   it("Should not register a user when password is not provided", async () => {
    //     // db data setup

    //     const mockUser = {
    //       firstname: "unittestIago",
    //       lastname: "unittestHedderly",
    //       email: "unittestihedderlyrr@upenn.edu",
    //       username: "unittestihedderlyrr",
    //     };

    //     const insertedId = 1000;

    //     const mockDbRows = [
    //       {
    //         id: insertedId,
    //       },
    //     ];

    //     const mockQueryResult = {
    //       rows: mockDbRows,
    //     };

    //     queryStub = sinon.stub(client, "query").returns(mockQueryResult);

    //     // request setup

    //     const req = {
    //       body: mockUser,
    //       dbClient: client,
    //     };

    //     // call to createUser

    //     const wrappedMiddleware = wrapMidd(createUser);

    //     await wrappedMiddleware(req, res);

    //     // expects

    //     expect(queryStub.notCalled).to.be.equal(true);
    //     expect(
    //       statusStub.calledOnceWithExactly(httpStatus.BAD_REQUEST)
    //     ).to.be.equal(true);
    //     expect(
    //       sendStub.calledOnceWithExactly({
    //         message: "Username and password are required",
    //       })
    //     ).to.be.equal(true);
    //     // console.log('passwordNotProvided.releaseStub.calledTimes', releaseStub.getCalls());
    //     expect(releaseStub.calledOnce).to.be.equal(true);
    //   });
    // });

    // describe("getUserById", () => {
    //   let getClientStub;
    //   let client;
    //   let releaseStub;
    //   let queryStub;
    //   let res;
    //   let statusStub;
    //   let sendStub;
    //   let jsonStub;

    //   beforeEach(async () => {
    //     // db client setup
    //     // TODO: can this be simplified?

    //     client = {
    //       release: () => {},
    //       query: () => {},
    //     };

    //     getClientStub = sinon.stub(db, "getClient");

    //     releaseStub = sinon.spy(client, "release");

    //     getClientStub.returns(client);

    //     // client = await db.getClient();

    //     // response setup

    //     res = {
    //       status() {},
    //       json() {},
    //       send() {},
    //     };

    //     statusStub = sinon.stub(res, "status").returns(res);
    //     jsonStub = sinon.spy(res, "json");
    //     sendStub = sinon.spy(res, "send");
    //   });

    //   afterEach(() => {
    //     // clean up

    //     getClientStub.restore();
    //     queryStub.restore();
    //     statusStub.restore();
    //     jsonStub.restore();
    //     releaseStub.restore();
    //     sendStub.restore();
    //   });

    //   it("Should get user by id", async () => {
    //     // user data setup

    //     const idToSearch = 1000;
    //     const mockUser = {
    //       id: idToSearch,
    //       firstname: "unittestIago",
    //       lastname: "unittestHedderly",
    //       email: "unittestihedderlyrr@upenn.edu",
    //       username: "unittestihedderlyrr",
    //       passwd: "unittest665nfsf",
    //       avatar_url: null,
    //     };
    //     const mockDbRows = [mockUser];

    //     const mockQueryResult = {
    //       rows: mockDbRows,
    //     };

    //     queryStub = sinon.stub(client, "query").returns(mockQueryResult);

    //     // request setup

    //     const req = {
    //       params: {
    //         id: idToSearch,
    //       },
    //       dbClient: client,
    //     };

    //     // get user call

    //     const wrappedMiddleware = wrapMidd(getUserById);

    //     await wrappedMiddleware(req, res);

    //     // expects

    //     // expect(getClientStub.calledOnce).to.be.equal(true);
    //     expect(queryStub.calledOnce).to.be.equal(true);
    //     expect(statusStub.calledOnceWithExactly(httpStatus.OK)).to.be.equal(true);
    //     expect(
    //       jsonStub.calledOnceWithExactly({
    //         data: mockDbRows,
    //         message: null,
    //       })
    //     ).to.be.equal(true);
    //     expect(releaseStub.calledOnce).to.be.equal(true);
    //   });
  });
});
