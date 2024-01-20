const httpStatus = require("http-status");
const { knex } = require("../common/database");
const {
  getAccessTokenPayload,
  getSignedJwt,
  verifyToken,
  deleteRefreshToken,
  getErrorMessageByErrorName,
} = require("./helpers");
const { JoiLib, validate } = require("../common/validator");
const ApiError = require("../common/classes/ApiError");
const { authService } = require("./service");

const login = async (req, res) => {
  const { username, passwd } = req.body;

  // Validate.

  const validationFields = {
    username: JoiLib.string().required().label("Username"),
    passwd: JoiLib.string().required().label("Password"),
  };

  const { joiErrors, commaSeparatedErrors } = validate(
    req.body,
    validationFields
  );

  if (joiErrors) {
    throw new ApiError(httpStatus.BAD_REQUEST, commaSeparatedErrors);
  }

  // Perform login attempt.

  const loginResult = await authService.login(username, passwd);

  if (!loginResult.success) {
    console.log("loginResult.code", loginResult.code);

    const errorMessage = `Username or password not valid`;

    return res.status(httpStatus.BAD_REQUEST).send({
      message: errorMessage,
    });
  }

  const { accessToken, refreshToken } = loginResult;

  return res.status(httpStatus.OK).send({
    data: {
      accessToken,
      refreshToken,
    },
  });
};

const doRefreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  // Validate.

  if (!refreshToken) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: "There was an error processing your request. Error code: RT001",
    });
  }

  // Perform refresh token attempt.

  const refreshTokenResult = await authService.doRefreshToken(refreshToken);

  console.log("refreshTokenResult", refreshTokenResult);

  // Send response.

  if (refreshTokenResult.success) {
    return res.status(httpStatus.OK).json({
      accessToken: refreshTokenResult.accessToken,
    });
  }

  const responseMap = {
    notFound: {
      status: httpStatus.BAD_REQUEST,
      message: "There was an error processing your request. Error code: RT002",
    },
    expired: {
      status: httpStatus.FORBIDDEN,
      message: "The refresh token has expired",
    },
    invalid: {
      status: httpStatus.BAD_REQUEST,
      message: "There was an error processing your request. Error code: RT004",
    },
    userNotFound: {
      status: httpStatus.BAD_REQUEST,
      message: "There was an error processing your request. Error code: RT003",
    },
  };

  const response = responseMap[refreshTokenResult.code];

  return res.status(response.status).send({
    message: response.message,
  });
};

module.exports = {
  login,
  doRefreshToken,
};
