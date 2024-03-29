/* eslint-disable no-console */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const constants = require("../common/constants");
const { knex } = require("../common/database");

const getSignedJwt = ({ tokenPayload, secret, expiresIn }) => {
  const tokenOptions = {
    expiresIn,
  };
  return jwt.sign(tokenPayload, secret, tokenOptions);
};

const storeRefreshToken = async ({ tokenValue, userAccountId }) => {
  const results = await knex("refresh_token").insert({
    token_value: tokenValue,
    user_account_id: userAccountId,
  });

  const refreshTokenData = results.rows[0];

  return refreshTokenData;
};

const createRefreshToken = async (userAccountId) => {
  const refreshTokenPayload = {
    id: userAccountId,
  };

  const refreshTokenValue = getSignedJwt({
    tokenPayload: refreshTokenPayload,
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
  });

  const refreshTokenData = {
    tokenValue: refreshTokenValue,
    userAccountId,
  };

  await storeRefreshToken(refreshTokenData);

  return refreshTokenValue;
};

const getAccessTokenPayload = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  firstname: user.firstname,
  lastname: user.lastname,
  role: user.role,
});

/**
 * Check if the token was signed
 * by this backend app and if it
 * isn't expired.
 * @param {*} tokenData
 * @returns
 */
const verifyToken = (tokenData) => {
  try {
    jwt.verify(tokenData, process.env.JWT_SECRET);
    return {
      isValid: true,
    };
  } catch (error) {
    if (error.name !== constants.TOKEN_EXPIRED_ERROR) {
      // Tokens will expire eventually and I won't log those errors.
      // But, if there are other errors, that may be
      // and indication of malicious activity, so I will log those.

      console.log(error);
    }

    return {
      isValid: false,
      errorName: error.name,
    };
  }
};

const hashPassword = async (passwd) => {
  const saltRounds = 10;

  const salt = await bcrypt.genSalt(saltRounds);

  const passwordHash = bcrypt.hash(passwd, salt);

  return passwordHash;
};

const comparePasswords = async (clearTextPassword, hashedPassword) =>
  bcrypt.compare(clearTextPassword, hashedPassword);

module.exports = {
  authHelpers: {
    getAccessTokenPayload,
    hashPassword,
    comparePasswords,
    createRefreshToken,
    getSignedJwt,
    verifyToken,
  },
};
