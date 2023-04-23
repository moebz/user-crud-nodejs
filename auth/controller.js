const httpStatus = require("http-status");

const {
  getAccessTokenPayload,
  comparePasswords,
  createRefreshToken,
  getSignedJwt,
  getRefreshTokenData,
  isRefreshTokenExpired,
  deleteRefreshToken,
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

  // console.log({ username, passwd });

  const errorMessage = `Username or password not valid`;

  const result = await req.dbClient.query(
    "SELECT * FROM user_account WHERE username = $1",
    [username]
  );

  // console.log({ result });

  const user = result?.rows?.[0];

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

  const refreshToken = await createRefreshToken(req.dbClient, user.id);

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
    dbClient: req.dbClient,
    refreshToken,
  });

  console.log(refreshTokenData);

  if (!refreshTokenData) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: "There was an error processing your request. Error code: RT002",
    });
  }

  if (isRefreshTokenExpired(refreshTokenData)) {
    deleteRefreshToken({
      dbClient: req.dbClient,
      refreshToken: refreshTokenData.id,
    });

    return res.status(httpStatus.FORBIDDEN).send({
      message: "Refresh token has expired",
    });
  }

  const userId = refreshTokenData.user_account_id;

  const result = await req.dbClient.query(
    "SELECT * FROM user_account WHERE id = $1",
    [userId]
  );

  const user = result?.rows?.[0];

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
