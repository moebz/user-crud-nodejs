/* eslint-disable no-console */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const storeRefreshToken = async ({
  dbClient,
  tokenValue,
  expiryDate,
  userAccountId,
}) => {
  const results = await dbClient.query(
    `INSERT INTO refresh_token (
      token_value,
      expiry_date,
      user_account_id
    ) VALUES (
      $1,
      $2,
      $3
    ) RETURNING *`,
    [tokenValue, expiryDate, userAccountId]
  );

  const refreshTokenData = results.rows[0];

  return refreshTokenData;
};

const createRefreshToken = async (dbClient, userAccountId) => {
  const expiredAt = new Date();

  console.log("createRefreshToken.expiredAt.before", expiredAt);

  const secondsToAdd = parseInt(
    process.env.REFRESH_TOKEN_EXPIRATION_SECONDS,
    10
  );

  const currentSeconds = expiredAt.getSeconds();

  const secondsToSet = currentSeconds + secondsToAdd;

  console.log({
    secondsToAdd,
    currentSeconds,
    secondsToSet,
  });

  expiredAt.setSeconds(secondsToSet);

  console.log("createRefreshToken.expiredAt.after", expiredAt);
  console.log(
    "createRefreshToken.expiredAt.toISOString",
    expiredAt.toISOString()
  );

  const tokenValue = uuidv4();

  const refreshTokenData = {
    dbClient,
    tokenValue,
    userAccountId,
    expiryDate: expiredAt.toISOString(),
  };

  console.log({
    tokenValue,
    userAccountId,
    expiryDate: expiredAt.toISOString(),
  });

  await storeRefreshToken(refreshTokenData);

  return tokenValue;
};

const getAccessTokenPayload = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  firstname: user.firstname,
  lastname: user.lastname,
  role: user.role,
});

const getSignedJwt = ({ tokenPayload, secret, expiresIn }) => {
  const tokenOptions = {
    expiresIn,
  };
  return jwt.sign(tokenPayload, secret, tokenOptions);
};

const isRefreshTokenExpired = (tokenData) => {
  const nowDate = new Date();
  console.log("isRefreshTokenExpired.tokenData", tokenData);
  const expiryDate = new Date(tokenData.expiry_date);
  const comparisonResult = expiryDate.getTime() < nowDate.getTime();
  console.log("isRefreshTokenExpired.expiryDate", expiryDate);
  console.log("isRefreshTokenExpired.nowDate", nowDate);
  console.log("isRefreshTokenExpired.comparisonResult", comparisonResult);
  return comparisonResult;
};

const getRefreshTokenData = async ({ dbClient, refreshToken }) => {
  const result = await dbClient.query(
    "SELECT * FROM refresh_token WHERE token_value = $1",
    [refreshToken]
  );

  const refreshTokenData = result?.rows?.[0];

  return refreshTokenData;
};

const deleteRefreshToken = async ({ dbClient, refreshToken }) => {
  await dbClient.query(
    `DELETE FROM refresh_token
    WHERE token_value = $1`,
    [refreshToken]
  );
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
  getAccessTokenPayload,
  hashPassword,
  comparePasswords,
  createRefreshToken,
  getSignedJwt,
  isRefreshTokenExpired,
  getRefreshTokenData,
  deleteRefreshToken,
};
