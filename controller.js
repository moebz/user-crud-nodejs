const Pool = require("pg").Pool;
const jwt = require("jsonwebtoken");

const helpers = require("./helpers");

const {
  RDB_USER,
  RDB_HOST,
  RDB_NAME,
  RDB_PASSWORD,
  RDB_PORT,
  JWT_SECRET,
  JWT_EXPIRATION,
} = process.env;

const pool = new Pool({
  user: RDB_USER,
  host: RDB_HOST,
  database: RDB_NAME,
  password: RDB_PASSWORD,
  port: RDB_PORT,
});

const getUsers = async (request, response) => {
  const result = await pool.query("SELECT * FROM user_account ORDER BY id ASC");
  response.status(200).json(result.rows);
};

const getUserById = async (request, response) => {
  const id = parseInt(request.params.id);
  const result = await pool.query("SELECT * FROM user_account WHERE id = $1", [
    id,
  ]);
  response.status(200).json(result.rows);
};

const createUser = async (request, response) => {
  const { firstname, lastname, email, username, passwd } = request.body;

  console.log({
    // request: request,
    requestBody: request.body,
    requestFile: request.file,
  });

  //prueba
  return response.status(200).send("//prueba");

  if (!request?.file?.path) {
    return response.status(201).send({
      message: 'An error occurred while processing the request'
    });
  }

  const avatarUrl = request.file.path;

  const passwordHash = await helpers.hashPassword(passwd);

  const results = await pool.query(
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

  response.status(201).send(`User added with ID: ${results.rows[0].id}`);
};

const login = async (request, response) => {
  const { username, passwd } = request.body;

  const errorMessage = `Username or password not valid`;
  const httpErrorStatus = 400;

  const result = await pool.query(
    "SELECT * FROM user_account WHERE username = $1",
    [username]
  );

  const user = result?.rows?.[0];

  if (!user) {
    return response.status(httpErrorStatus).send({
      message: errorMessage,
    });
  }

  const loginResult = await helpers.comparePasswords(passwd, user.passwd);

  if (!loginResult) {
    return response.status(httpErrorStatus).send({
      message: errorMessage,
    });
  }

  const tokenPayload = {
    id: user.id,
  };

  const tokenOptions = {
    expiresIn: JWT_EXPIRATION,
  };

  console.log({
    tokenOptions,
  });

  const token = jwt.sign(tokenPayload, JWT_SECRET, tokenOptions);

  return response.status(200).send({
    data: {
      userToken: token,
    },
  });
};

const updateUser = async (request, response) => {
  const id = parseInt(request.params.id);
  const { firstname, lastname, email, username } = request.body;

  await pool.query(
    `UPDATE user_account SET
      firstname = $1,
      lastname = $2,
      email = $3,
      username = $4
    WHERE
      id = $5`,
    [firstname, lastname, email, username, id]
  );

  response.status(200).send(`User modified with ID: ${id}`);
};

const deleteUser = async (request, response) => {
  const id = parseInt(request.params.id);

  await pool.query("DELETE FROM user_account WHERE id = $1", [id]);

  response.status(200).send(`User deleted with ID: ${id}`);
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  login,
  updateUser,
  deleteUser,
};
