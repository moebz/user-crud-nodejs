const constants = require("../common/constants");
const { userRepository } = require("../user/repository");
const { authHelpers } = require("./helpers");
const { authRepository } = require("./repository");

const login = async (username, passwd) => {
  const user = await authRepository.getUserByUsername(username);

  console.log("login.user", user);

  if (!user) {
    return {
      success: false,
      code: `userNotFound`,
    };
  }

  const loginResult = await authHelpers.comparePasswords(passwd, user.passwd);

  if (!loginResult) {
    return {
      success: false,
      code: `wrongPassword`,
    };
  }

  const tokenPayload = authHelpers.getAccessTokenPayload(loginResult.user);

  const accessToken = authHelpers.getSignedJwt({
    tokenPayload,
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION,
  });

  const refreshToken = await authHelpers.createRefreshToken(user.id);

  return {
    success: true,
    code: `loginSuccess`,
    accessToken,
    refreshToken,
  };
};

const doRefreshToken = async (refreshToken) => {
  const refreshTokenData = await authRepository.getRefreshTokenData({
    refreshToken,
  });

  console.log(refreshTokenData);

  // If there is no matching token in the DB
  // then the token was deleted manually or
  // it was deleted in this function
  // in a previous call
  // because it was not valid anymore.

  if (!refreshTokenData) {
    return { success: false, code: "notFound" };
  }

  const verifResult = authHelpers.verifyToken(refreshTokenData.token_value);

  if (!verifResult.isValid) {
    authRepository.deleteRefreshToken({
      refreshToken: refreshTokenData.id,
    });

    if (verifResult.errorName === constants.TOKEN_EXPIRED_ERROR) {
      return { success: false, code: "expired" };
    }
    return { success: false, code: "invalid" };
  }

  const userId = refreshTokenData.user_account_id;

  const user = await userRepository.getById(userId);

  if (!user) {
    return { success: false, code: "userNotFound" };
  }

  console.log("doRefreshToken.user", user);

  const tokenPayload = authHelpers.getAccessTokenPayload(user);

  const newAccessToken = authHelpers.getSignedJwt({
    tokenPayload,
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION,
  });

  return {
    success: true,
    accessToken: newAccessToken,
  };
};

module.exports = {
  authService: {
    login,
    doRefreshToken,
  },
};
