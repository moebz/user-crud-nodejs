const Pool = require('pg').Pool;

const helpers = require('./helpers');

const {
  RDB_USER,
  RDB_HOST,
  RDB_NAME,
  RDB_PASSWORD,
  RDB_PORT,
} = process.env;

const pool = new Pool({
  user: RDB_USER,
  host: RDB_HOST,
  database: RDB_NAME,
  password: RDB_PASSWORD,
  port: RDB_PORT,
});

const getUsers = async (request, response) => {
  const result = await pool.query('SELECT * FROM user_account ORDER BY id ASC');
  response.status(200).json(result.rows);
};

const getUserById = async (request, response) => {
  const id = parseInt(request.params.id);
  const result = await pool.query('SELECT * FROM user_account WHERE id = $1', [id]);
  response.status(200).json(result.rows);
};

const createUser = async (request, response) => {
  const {
    firstname,
    lastname,
    email,
    username,
    passwd
  } = request.body;

  const passwordHash = await helpers.hashPassword(passwd);

  const results = await pool.query(
    `INSERT INTO user_account (
      firstname,
      lastname,
      email,
      username,
      passwd
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5
    ) RETURNING *`,
    [
      firstname,
      lastname,
      email,
      username,
      passwordHash,
    ]
  );

  response.status(201).send(`User added with ID: ${results.rows[0].id}`);
}

const login = async (request, response) => {
  const {
    username,
    passwd,
  } = request.body;

  const errorMessage = `Username or password not valid`;
  const httpErrorStatus = 400;

  const result = await pool.query('SELECT * FROM user_account WHERE username = $1', [username]);
  const user = result?.rows?.[0];
  if (!user) {
    return response.status(httpErrorStatus).send(errorMessage);
  }

  const bcrypt = require('bcrypt');

  const loginResult = await bcrypt
    .compare(passwd, user.passwd);

  if (!loginResult) {
    return response.status(httpErrorStatus).send(errorMessage);
  }

  return response.status(200).send('Login success');
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  login,
};