const httpStatus = require("http-status");

require("dotenv").config();

const { wrapMidd, errorHandler } = require("../src/common/helpers");

const authHelpers = require("../src/auth/helpers");
const { createUser, getUserById } = require("../src/user/controller");
const { userModel } = require("../src/user/model");
const ApiError = require("../src/common/classes/ApiError");

jest.mock("../src/user/model");
jest.mock("../src/auth/helpers");

describe("Unit: UserController", () => {
  describe("createUser", () => {
    let res;

    beforeEach(async () => {
      // Response setup.

      res = {
        json: jest.fn(),
        status: jest.fn(() => res),
        send: jest.fn(),
      };

      // Reset mocks.

      userModel.create.mockClear();
      res.status.mockClear();
      res.send.mockClear();
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

      await createUser(req, res);

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

    it("Should not register a user when password is not provided", async () => {
      // Arrange.

      const mockUser = {
        firstname: "unittestIago",
        lastname: "unittestHedderly",
        email: "unittestihedderlyrr@upenn.edu",
        username: "unittestihedderlyrr",
      };

      const req = {
        body: mockUser,
      };

      // Act.

      let errorThrown;

      try {
        await createUser(req, res);
      } catch (e) {
        errorThrown = e;
      }

      // Assert.

      // The error thrown should be an instance of ApiError.

      expect(errorThrown).toBeInstanceOf(ApiError);
      expect(errorThrown.statusCode).toBe(httpStatus.BAD_REQUEST);

      // The create function should not have been called.

      expect(userModel.create).not.toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    let res;

    beforeEach(async () => {
      // Response setup.

      res = {
        json: jest.fn(),
        status: jest.fn(() => res),
        send: jest.fn(),
      };

      // Reset mocks.

      res.status.mockClear();
      res.send.mockClear();
    });

    it("Should get user by id", async () => {
      // Arrange.

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

      userModel.getById.mockResolvedValue(mockUser);

      const req = {
        params: {
          id: idToSearch,
        },
      };

      // Act.

      await getUserById(req, res);

      // Assert.

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
      expect(res.send).toHaveBeenCalledTimes(1);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockUser,
        })
      );
    });
  });
});
