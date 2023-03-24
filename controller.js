const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const helpers = require("./helpers");

// console.log = function () {};

const getUsers = async (req, res) => {
  const {
    pageSize,
    pageNumber,
    orderBy,
    orderDirection,
    filter,
    firstname,
    lastname,
    email,
    username,
  } = req.query;

  console.log("getUsers.urlQuery", req.query);

  const mOrderBy = orderBy || "id";

  if (
    !["id", "firstname", "lastname", "email", "username"].includes(mOrderBy)
  ) {
    throw new Error("Column to order by not valid");
  }

  const mOrderDirection = orderDirection ? orderDirection.toUpperCase() : "ASC";

  if (!["DESC", "ASC"].includes(mOrderDirection)) {
    throw new Error("Order direction not valid");
  }

  const allParams = [pageNumber, pageSize];
  const paramsForCount = [];

  if (!pageSize || !pageNumber) {
    throw new Error("Page size and page number are required");
  }

  const whereClauseItems = [];
  const whereClauseItemsForCount = [];

  if (filter) {
    const nextParamPosition = allParams.length + 1;
    const nextParamForCountPosition = paramsForCount.length + 1;

    allParams.push(`%${filter}%`);
    paramsForCount.push(`%${filter}%`);

    whereClauseItems.push(`firstname ILIKE $${nextParamPosition}`);
    whereClauseItemsForCount.push(
      `firstname ILIKE $${nextParamForCountPosition}`
    );

    whereClauseItems.push(`lastname ILIKE $${nextParamPosition}`);
    whereClauseItemsForCount.push(
      `lastname ILIKE $${nextParamForCountPosition}`
    );

    whereClauseItems.push(`email ILIKE $${nextParamPosition}`);
    whereClauseItemsForCount.push(`email ILIKE $${nextParamForCountPosition}`);

    whereClauseItems.push(`username ILIKE $${nextParamPosition}`);
    whereClauseItemsForCount.push(
      `username ILIKE $${nextParamForCountPosition}`
    );
  }

  let whereClause = whereClauseItems.join(" OR ");

  whereClause = whereClause ? `WHERE ${whereClause}` : "";

  const orderClause = `ORDER BY ${mOrderBy} ${mOrderDirection}`;

  const query = `
    SELECT
      id, firstname, lastname, email, username, passwd, avatar_url
    FROM
      user_account
    ${whereClause}
    ${orderClause}
    LIMIT $2 OFFSET (($1 - 1) * $2);
  `;

  console.log("query", query);
  console.log("allParams", allParams);

  const result = await req.dbClient.query(query, allParams);

  let countWhereClause = whereClauseItemsForCount.join(" OR ");
  countWhereClause = countWhereClause ? `WHERE ${countWhereClause}` : "";

  const countQuery = `SELECT count(*) as total FROM user_account ${countWhereClause}`;

  console.log("countQuery", countQuery);
  console.log("paramsForCount", paramsForCount);

  const countResult = await req.dbClient.query(countQuery, paramsForCount);

  res.status(httpStatus.OK).json({
    data: {
      rows: result.rows,
      total: countResult.rows[0].total,
    },
  });
};

const getUserById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = await req.dbClient.query(
    "SELECT * FROM user_account WHERE id = $1",
    [id]
  );
  res.status(httpStatus.OK).json({ data: result.rows, message: null });
};

const createUser = async (req, res) => {
  // console.log({ "createUser.req": Object.getOwnPropertyNames(req) });

  // return res.status(httpStatus.UNAUTHORIZED).send({
  //   message: "Test error",
  // });

  const { firstname, lastname, email, username, passwd } = req.body;

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

  // console.log({
  //   // request: request,
  //   requestBody: req.body,
  //   requestFile: req.file,
  // });

  let avatarUrl = null;

  if (req?.file?.path) {
    // console.log("there is a file in the request");
    avatarUrl = req.file.path;
  }

  const passwordHash = await helpers.hashPassword(passwd);

  const results = await req.dbClient.query(
    `INSERT INTO user_account (
      firstname,
      lastname,
      email,
      username,
      passwd,
      avatar_url
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6
    ) RETURNING *`,
    [firstname, lastname, email, username, passwordHash, avatarUrl]
  );

  const insertedId = results.rows[0].id;

  if (req?.file?.path) {
    const userUploadDirectory = `public/uploads/avatar/${insertedId}/`;

    if (!fs.existsSync(userUploadDirectory)) {
      fs.mkdirSync(userUploadDirectory, { recursive: true });
    }

    const fullNewFilepath = `${userUploadDirectory}${req.file.filename}`;

    fs.renameSync(req.file.path, fullNewFilepath);
  }

  return res
    .status(httpStatus.CREATED)
    .send({ message: `User added with ID: ${insertedId}` });
};

// TODO: mover
const getSignedJwt = ({ tokenPayload, secret, expiresIn }) => {
  const tokenOptions = {
    expiresIn,
  };
  return jwt.sign(tokenPayload, secret, tokenOptions);
};

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

  if (!user) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: `${errorMessage}`,
    });
  }

  const loginResult = await helpers.comparePasswords(passwd, user.passwd);

  if (!loginResult) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: `${errorMessage}`,
    });
  }

  const tokenPayload = {
    id: user.id,
  };

  const userToken = getSignedJwt({
    tokenPayload,
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION,
  });

  const refreshToken = await createRefreshToken(req.dbClient, user.id);

  return res.status(httpStatus.OK).send({
    data: {
      userToken,
      refreshToken,
    },
  });
};

const updateUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { firstname, lastname, email, username } = req.body;

  await req.dbClient.query(
    `UPDATE user_account SET
      firstname = $1,
      lastname = $2,
      email = $3,
      username = $4
    WHERE
      id = $5`,
    [firstname, lastname, email, username, id]
  );

  res.status(httpStatus.OK).send(`User modified with ID: ${id}`);
};

const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  await req.dbClient.query("DELETE FROM user_account WHERE id = $1", [id]);

  res.status(httpStatus.OK).send(`User deleted with ID: ${id}`);
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

  const userId = refreshToken.user_id;

  const tokenPayload = {
    id: userId,
  };

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
  getUsers,
  getUserById,
  createUser,
  login,
  updateUser,
  deleteUser,
  doRefreshToken,
};
