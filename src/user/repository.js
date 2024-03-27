const httpStatus = require("http-status");
const constants = require("../common/constants");
const ApiError = require("../common/classes/ApiError");
const { knex } = require("../common/database");

const getById = ({ id }, columns) =>
  knex("user_account").select(columns).where("id", id).first();

const get = async ({
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

  if (!pageSize || !pageNumber) {
    throw new Error("Page size and page number are required");
  }

  const query = knex("user_account");

  if (filter) {
    query.whereILike("firstname", `%${filter}%`);
    query.orWhereILike("lastname", `%${filter}%`);
    query.orWhereILike("email", `%${filter}%`);
    query.orWhereILike("username", `%${filter}%`);
  }

  const countResult = await query.clone().count("* as count").first();

  query.orderBy([{ column: mOrderBy, order: mOrderDirection }]);
  query.limit(pageSize);
  query.offset((pageNumber - 1) * pageSize);

  const queryResult = await query;

  // console.log({
  //   countResult,
  //   queryResult,
  // });

  return { rows: queryResult, total: countResult.count };
};

const create = async ({
  firstname,
  lastname,
  email,
  username,
  passwordHash,
  role,
}) => {
  let results;

  try {
    results = await knex("user_account")
      .insert({
        firstname,
        lastname,
        email,
        username,
        passwd: passwordHash,
        role,
      })
      .returning("id");
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

  return results[0];
};

const update = async ({
  firstname,
  lastname,
  email,
  username,
  avatarUrl,
  role,
  id,
}) => {
  try {
    await knex("user_account").where("id", id).update({
      firstname,
      lastname,
      email,
      username,
      avatar_url: avatarUrl,
      role,
    });
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
const doDelete = ({ id }) => knex("user_account").where("id", id).del();

module.exports = {
  userRepository: { getById, get, create, update, doDelete },
};
