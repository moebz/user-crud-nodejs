const httpStatus = require("http-status");
const constants = require("../common/constants");
const ApiError = require("../common/classes/ApiError");

const getById = async ({ dbClient, id }) => {
  const result = await dbClient.query(
    "SELECT * FROM user_account WHERE id = $1",
    [id]
  );
  return result;
};

const get = async ({
  dbClient,
  pageNumber,
  pageSize,
  filter,
  orderBy,
  orderDirection,
}) => {
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

  const result = await dbClient.query(query, allParams);

  let countWhereClause = whereClauseItemsForCount.join(" OR ");
  countWhereClause = countWhereClause ? `WHERE ${countWhereClause}` : "";

  const countQuery = `SELECT count(*) as total FROM user_account ${countWhereClause}`;

  console.log("countQuery", countQuery);
  console.log("paramsForCount", paramsForCount);

  const countResult = await dbClient.query(countQuery, paramsForCount);

  return { rows: result.rows, total: countResult.rows[0].total };
};

const create = async ({
  dbClient,
  firstname,
  lastname,
  email,
  username,
  passwordHash,
  role,
}) => {
  let results;

  try {
    results = await dbClient.query(
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

  return results.rows[0];
};

const update = async ({
  dbClient,
  firstname,
  lastname,
  email,
  username,
  avatarUrl,
  role,
  id,
}) => {
  const params = [];
  const columnAndPlaceholderList = [];

  if (firstname !== undefined) {
    params.push(firstname);
    columnAndPlaceholderList.push(`firstname = $${params.length}`);
  }

  if (lastname !== undefined) {
    params.push(lastname);
    columnAndPlaceholderList.push(`lastname = $${params.length}`);
  }

  if (email !== undefined) {
    params.push(email);
    columnAndPlaceholderList.push(`email = $${params.length}`);
  }

  if (username !== undefined) {
    params.push(username);
    columnAndPlaceholderList.push(`username = $${params.length}`);
  }

  if (avatarUrl !== undefined) {
    params.push(avatarUrl);
    columnAndPlaceholderList.push(`avatar_url = $${params.length}`);
  }

  if (role !== undefined) {
    params.push(role);
    columnAndPlaceholderList.push(`role = $${params.length}`);
  }

  const columnsAndPlaceholdersSQL = columnAndPlaceholderList.join(", ");

  params.push(id);
  const idParamNumber = params.length;

  const sqlQuery = `
    UPDATE user_account SET
      ${columnsAndPlaceholdersSQL}
    WHERE
      id = $${idParamNumber}
  `;

  console.log("userModel.update.sqlQuery", sqlQuery);
  console.log("userModel.update.params", params);

  try {
    await dbClient.query(sqlQuery, params);
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
};

// delete is not allowed as a variable nor function name
const doDelete = async ({ dbClient, id }) => {
  await dbClient.query("DELETE FROM user_account WHERE id = $1", [id]);
};

module.exports = {
  userModel: { getById, get, create, update, doDelete },
};
