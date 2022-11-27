const Pool = require('pg').Pool;

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

module.exports = {
  getUsers,
  getUserById,
};