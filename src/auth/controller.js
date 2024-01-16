const httpStatus = require("http-status");
const { knex } = require("../common/database");
const {
  getAccessTokenPayload,
  comparePasswords,
  createRefreshToken,
  getSignedJwt,
  getRefreshTokenData,
  verifyToken,
  deleteRefreshToken,
  getErrorMessageByErrorName,
} = require("./helpers");

const login = async (req, res) => {
  const { username, passwd } = req.body;

  if (
    !username ||
    typeof username !== "string" ||
    !passwd ||
    typeof passwd !== "string"
  ) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: "Username and password are required",
    });
  }

  const errorMessage = `Username or password not valid`;

  const result = await knex("user_account")
    .where("username", username)
    .select();

  const user = result?.[0];

  console.log("login.user", user);

  if (!user) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: `${errorMessage}`,
    });
  }

  const loginResult = await comparePasswords(passwd, user.passwd);

  if (!loginResult) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: `${errorMessage}`,
    });
  }

  const tokenPayload = getAccessTokenPayload(user);

  const accessToken = getSignedJwt({
    tokenPayload,
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION,
  });

  const refreshToken = await createRefreshToken(user.id);

  return res.status(httpStatus.OK).send({
    data: {
      accessToken,
      refreshToken,
    },
  });
};

const doRefreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken == null) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: "There was an error processing your request. Error code: RT001",
    });
  }

  const refreshTokenData = await getRefreshTokenData({
    refreshToken,
  });

  console.log(refreshTokenData);

  // If there is no matching token in the DB
  // then the token was deleted manually or
  // it was deleted in this function
  // in a previous call
  // because it was not valid anymore.

  if (!refreshTokenData) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: "There was an error processing your request. Error code: RT002",
    });
  }

  const verifResult = verifyToken(refreshTokenData.token_value);

  if (!verifResult.isValid) {
    deleteRefreshToken({
      refreshToken: refreshTokenData.id,
    });

    return res.status(httpStatus.FORBIDDEN).send({
      message: getErrorMessageByErrorName(verifResult.errorName),
    });
  }

  const userId = refreshTokenData.user_account_id;

  const result = await knex("user_account").where("id", userId).select();

  const user = result?.[0];

  if (!user) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: "There was an error processing your request. Error code: RT003",
    });
  }

  console.log("doRefreshToken.user", user);

  const tokenPayload = getAccessTokenPayload(user);

  const newAccessToken = getSignedJwt({
    tokenPayload,
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION,
  });

  return res.status(httpStatus.OK).json({
    accessToken: newAccessToken,
  });
};

module.exports = {
  login,
  doRefreshToken,
};
