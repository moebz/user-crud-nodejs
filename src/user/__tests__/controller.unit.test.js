/* eslint-disable camelcase */
/* eslint-disable import/newline-after-import */
require("dotenv").config();

const httpStatus = require("http-status");

const { createUser, getUserById } = require("../controller");

const { userService } = require("../service");
jest.mock("../service");

const ApiError = require("../../common/classes/ApiError");

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

      userService.createUser.mockClear();
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

      const insertedId = "1000";

      userService.createUser.mockResolvedValue(insertedId);

      const req = {
        body: incomingUserData,
      };

      // Act.

      await createUser(req, res);

      // Assert.

      // The hashing function should have been called one time
      // with the provided password.

      expect(res.status).toHaveBeenCalledTimes(1);

      // userService.createUser should have been called one time
      // with an object that contains the original data.

      expect(userService.createUser).toHaveBeenCalledTimes(1);
      expect(userService.createUser).toHaveBeenCalledWith(
        expect.objectContaining(incomingUserData)
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

      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it("Should not register an user when the password confirmation doesn't match the password", async () => {
      // Arrange.

      const mockUser = {
        firstname: "unittestIago",
        lastname: "unittestHedderly",
        email: "unittestihedderlyrr@upenn.edu",
        username: "unittestihedderlyrr",
        passwd: "someValue",
        passwd_confirmation: "anotherValue",
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

      // The error thrown should have a status code of 400.
      expect(errorThrown.statusCode).toBe(httpStatus.BAD_REQUEST);

      // The create function should not have been called.
      expect(userService.createUser).not.toHaveBeenCalled();

      // The error thrown should have a message that contains
      // the words "password" and "confirmation".
      expect(errorThrown.message).toMatch(/password/i);
      expect(errorThrown.message).toMatch(/confirmation/i);
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

      const idToSearch = "1000";

      const mockUser = {
        id: idToSearch,
        firstname: "unittestIago",
        lastname: "unittestHedderly",
        email: "unittestihedderlyrr@upenn.edu",
        username: "unittestihedderlyrr",
        passwd: "unittest665nfsf",
        avatar_url: null,
      };

      userService.getUserById.mockResolvedValue(mockUser);

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
