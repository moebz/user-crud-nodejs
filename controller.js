const httpStatus = require("http-status");
const { db } = require("./database");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const helpers = require("./helpers");

// console.log = function () {};

const getUsers = async (req, res, next) => {
  const result = await req.dbClient.query(
    "SELECT * FROM user_account ORDER BY id ASC"
  );
  res.status(httpStatus.OK).json(result.rows);
};

const getUserById = async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await req.dbClient.query(
    "SELECT * FROM user_account WHERE id = $1",
    [id]
  );
  res.status(httpStatus.OK).json({ data: result.rows, message: null });
};

const createUser = async (req, res) => {
  console.log({ "createUser.req": Object.getOwnPropertyNames(req) });

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

  res
    .status(httpStatus.CREATED)
    .send({ message: `User added with ID: ${insertedId}` });
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

  console.log({ username, passwd });

  const errorMessage = `Username or password not valid`;

  const result = await req.dbClient.query(
    "SELECT * FROM user_account WHERE username = $1",
    [username]
  );

  console.log({ result });

  const user = result?.rows?.[0];

  if (!Boolean(user)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: errorMessage + "1",
    });
  }

  const loginResult = await helpers.comparePasswords(passwd, user.passwd);

  if (!Boolean(loginResult)) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: errorMessage + "2",
    });
  }

  const tokenPayload = {
    id: user.id,
  };

  const tokenOptions = {
    expiresIn: process.env.JWT_EXPIRATION,
  };

  // console.log({
  //   tokenOptions,
  // });

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, tokenOptions);

  return res.status(httpStatus.OK).send({
    data: {
      userToken: token,
    },
  });
};

const updateUser = async (req, res) => {
  const id = parseInt(req.params.id);
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
  const id = parseInt(req.params.id);

  await req.dbClient.query("DELETE FROM user_account WHERE id = $1", [id]);

  res.status(httpStatus.OK).send(`User deleted with ID: ${id}`);
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  login,
  updateUser,
  deleteUser,
};
