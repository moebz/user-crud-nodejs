/* eslint-disable camelcase */
/* eslint-disable import/newline-after-import */
require("dotenv").config();

const httpStatus = require("http-status");

const { authHelpers } = require("../../auth/helpers");
jest.mock("../../auth/helpers");

const { userService } = require("../service");

const { userRepository } = require("../repository");
jest.mock("../repository");

describe("Unit: UserService", () => {
  describe("createUser", () => {
    beforeEach(async () => {
      // Reset mocks.

      userRepository.create.mockClear();
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

      userRepository.create.mockResolvedValue({ id: insertedId });

      // Act.

      const result = await userService.createUser(incomingUserData);

      // Assert.

      // The hashing function should have been called one time
      // with the provided password.

      expect(authHelpers.hashPassword).toHaveBeenCalledWith(
        incomingUserData.passwd
      );

      // userRepository.create should have been called one time
      // with an object that contains all original data
      // but passwd_confirmation and passwd (we only store the hash).

      const { passwd, passwd_confirmation, ...expectedCreateParams } =
        incomingUserData;

      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining(expectedCreateParams)
      );

      // Check that the result is the inserted id.

      expect(result).toBe(insertedId);
    });
  });

  describe("getUserById", () => {
    beforeEach(async () => {
      // Reset mocks.

      userRepository.getById.mockClear();
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

      userRepository.getById.mockResolvedValue(mockUser);

      // Act.

      const userFound = await userService.getUserById(idToSearch);

      // Assert.

      expect(userRepository.getById).toHaveBeenCalledTimes(1);
      expect(userRepository.getById).toHaveBeenCalledWith({ id: idToSearch });
      expect(userFound).toBe(mockUser);
    });
  });
});
