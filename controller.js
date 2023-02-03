const httpStatus = require("http-status");
const { db } = require("./database");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const helpers = require("./helpers");

const getUsers = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const result = await client.query(
      "SELECT * FROM user_account ORDER BY id ASC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

const getUserById = async (request, response) => {
  const client = await db.getClient();
  try {
    const id = parseInt(request.params.id);
    const result = await client.query(
      "SELECT * FROM user_account WHERE id = $1",
      [id]
    );
    response.status(200).json({ data: result.rows, code: null, message: null });
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

const createUser = async (request, response) => {
  const client = await db.getClient();
  try {
    const { firstname, lastname, email, username, passwd } = request.body;

    if (
      !username ||
      typeof username !== "string" ||
      !passwd ||
      typeof passwd !== "string"
    ) {
      return response.status(httpStatus.BAD_REQUEST).send({
        message: "Username and password are required",
      });
    }

    console.log({
      // request: request,
      requestBody: request.body,
      requestFile: request.file,
    });

    let avatarUrl = null;

    if (request?.file?.path) {
      avatarUrl = request.file.path;
    }

    const passwordHash = await helpers.hashPassword(passwd);

    const results = await client.query(
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

    if (request?.file?.path) {
      const userUploadDirectory = `public/uploads/avatar/${insertedId}/`;

      if (!fs.existsSync(userUploadDirectory)) {
        fs.mkdirSync(userUploadDirectory, { recursive: true });
      }

      const fullNewFilepath = `${userUploadDirectory}${request.file.filename}`;

      fs.renameSync(request.file.path, fullNewFilepath);
    }

    response
      .status(httpStatus.CREATED)
      .send({ message: `User added with ID: ${insertedId}` });
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

const login = async (request, response) => {
  const client = await db.getClient();
  try {
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
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

const updateUser = async (request, response) => {
  const client = await db.getClient();
  try {
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
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

const deleteUser = async (request, response) => {
  const client = await db.getClient();
  try {
    const id = parseInt(request.params.id);

    await pool.query("DELETE FROM user_account WHERE id = $1", [id]);

    response.status(200).send(`User deleted with ID: ${id}`);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  login,
  updateUser,
  deleteUser,
};
