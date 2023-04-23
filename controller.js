const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const { hashPassword } = require("./auth/helpers");

const constants = require("./constants");

const {
  JoiLib,
  validateRequest,
  getCommaSeparatedErrors,
} = require("./validator");
const ApiError = require("./classes/ApiError");

const baseValidationFields = {
  firstname: JoiLib.string().required().label("First name"),
  lastname: JoiLib.string().required().label("Last name"),
  email: JoiLib.string().required().email().label("Email"),
  username: JoiLib.string().required().label("Username"),
};
// console.log = function () {};

const getUsers = async (req, res) => {
  const { pageSize, pageNumber, orderBy, orderDirection, filter } = req.query;

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
      id, firstname, lastname, email, username, role, avatar_url
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
  const { firstname, lastname, email, username, passwd, role } = req.body;

  const validationFields = {
    ...baseValidationFields,
    passwd: JoiLib.string().required().label("Password"),
    passwd_confirmation: JoiLib.any()
      .equal(JoiLib.ref("passwd"))
      .required()
      .label("Password confirmation")
      .messages({ "any.only": "{{#label}} does not match" }),
  };

  // Renombrar 'error' de joi a 'joiErrors'
  const { error: joiErrors } = validateRequest(req, validationFields);

  if (joiErrors) {
    const commaSeparatedErrors = getCommaSeparatedErrors(joiErrors);
    throw new ApiError(httpStatus.BAD_REQUEST, commaSeparatedErrors);
  }

  const passwordHash = await hashPassword(passwd);

  let results;

  try {
    results = await req.dbClient.query(
      `INSERT INTO user_account (
        firstname,
        lastname,
        email,
        username,
        passwd,
        avatar_url,
        role
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
      ) RETURNING *`,
      [firstname, lastname, email, username, passwordHash, null, role]
    );
  } catch (error) {
    console.error(error);

    let errorMessage = "An unexpected error occurred (Error code: CU001)";

    if (error?.code === constants.DUPLICATE_KEY_ERROR) {
      switch (error?.constraint) {
        case "user_username_un":
          errorMessage = "Username already registered";
          break;
        case "user_email_un":
          errorMessage = "Email already registered";
          break;
        default:
          errorMessage = "An unexpected error occurred (Error code: CU002)";
          break;
      }
    }

    throw new ApiError(httpStatus.BAD_REQUEST, errorMessage);
  }

  const insertedId = results.rows[0].id;

  // Move avatar image
  // from tmp dir to public dir
  // and save the public path
  // in the db.

  const tmpUploadDirectory = req?.file?.path;

  if (tmpUploadDirectory) {
    const userUploadDirectory = `public/uploads/avatar/${insertedId}/`;

    if (!fs.existsSync(userUploadDirectory)) {
      fs.mkdirSync(userUploadDirectory, { recursive: true });
    }

    const fullNewFilepath = `${userUploadDirectory}${req.file.filename}`;

    fs.renameSync(req.file.path, fullNewFilepath);

    await req.dbClient.query(
      `UPDATE user_account SET
      avatar_url = $1
    WHERE
      id = $2`,
      [fullNewFilepath, insertedId]
    );
  }

  return res
    .status(httpStatus.CREATED)
    .send({ message: `User added with ID: ${insertedId}` });
};

const updateUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { firstname, lastname, email, username, role } = req.body;

  console.log("updateUser.req.body", req.body);

  const validationFields = baseValidationFields;

  // Renombrar 'error' de joi a 'joiErrors'
  const { error: joiErrors } = validateRequest(req, validationFields);

  if (joiErrors) {
    const commaSeparatedErrors = getCommaSeparatedErrors(joiErrors);
    throw new ApiError(httpStatus.BAD_REQUEST, commaSeparatedErrors);
  }

  const tmpUploadDirectory = req?.file?.path;
  let avatarUrl = null;

  if (tmpUploadDirectory) {
    const userUploadDirectory = `public/uploads/avatar/${id}/`;

    if (!fs.existsSync(userUploadDirectory)) {
      fs.mkdirSync(userUploadDirectory, { recursive: true });
    }

    const fullNewFilepath = `${userUploadDirectory}${req.file.filename}`;

    fs.renameSync(req.file.path, fullNewFilepath);

    avatarUrl = fullNewFilepath;
  }

  try {
    await req.dbClient.query(
      `UPDATE user_account SET
      firstname = $1,
      lastname = $2,
      email = $3,
      username = $4,
      avatar_url = $5,
      role = $6
    WHERE
      id = $7`,
      [firstname, lastname, email, username, avatarUrl, role, id]
    );
  } catch (error) {
    console.error(error);

    let errorMessage = "An unexpected error occurred (Error code: UU001)";

    if (error?.code === constants.DUPLICATE_KEY_ERROR) {
      switch (error?.constraint) {
        case "user_username_un":
          errorMessage = "Username already registered";
          break;
        case "user_email_un":
          errorMessage = "Email already registered";
          break;
        default:
          errorMessage = "An unexpected error occurred (Error code: CU002)";
          break;
      }
    }

    throw new ApiError(httpStatus.BAD_REQUEST, errorMessage);
  }

  res.status(httpStatus.OK).send(`User modified with ID: ${id}`);
};

const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  await req.dbClient.query("DELETE FROM user_account WHERE id = $1", [id]);

  res.status(httpStatus.OK).send(`User deleted with ID: ${id}`);
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
