const httpStatus = require("http-status");

const { hashPassword } = require("../auth/helpers");

const { JoiLib, validate } = require("../common/validator");
const ApiError = require("../common/classes/ApiError");

const { userModel } = require("./model");
const { storeAvatarFile, deleteAvatarFile } = require("./helpers");

const baseValidationFields = {
  firstname: JoiLib.string().required().label("First name"),
  lastname: JoiLib.string().required().label("Last name"),
  email: JoiLib.string().required().email().label("Email"),
  username: JoiLib.string().required().label("Username"),
};

const getUsers = async (req, res) => {
  const { pageSize, pageNumber, orderBy, orderDirection, filter } = req.query;

  console.log("getUsers.urlQuery", req.query);

  const result = await userModel.get({
    dbClient: req.dbClient,
    pageSize,
    pageNumber,
    orderBy,
    orderDirection,
    filter,
  });

  res.status(httpStatus.OK).send({
    data: {
      rows: result.rows,
      total: result.total,
    },
  });
};

const getUserById = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const result = await userModel.getById({
    dbClient: req.dbClient,
    id,
  });

  res.status(httpStatus.OK).send({ data: result.rows, message: null });
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

  const { joiErrors, commaSeparatedErrors } = validate(
    req.body,
    validationFields
  );

  if (joiErrors) {
    throw new ApiError(httpStatus.BAD_REQUEST, commaSeparatedErrors);
  }

  const passwordHash = await hashPassword(passwd);

  const result = await userModel.create({
    dbClient: req.dbClient,
    firstname,
    lastname,
    email,
    username,
    passwordHash,
    role,
  });

  const insertedId = result.id;

  // Move avatar image
  // from tmp dir to public dir
  // and save the public path
  // in the db.

  if (req.file) {
    const filepath = storeAvatarFile({
      file: req.file,
      userId: insertedId,
    });

    await userModel.update({
      dbClient: req.dbClient,
      avatarUrl: filepath,
      id: insertedId,
    });
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

  const { joiErrors, commaSeparatedErrors } = validate(
    req.body,
    validationFields
  );

  if (joiErrors) {
    throw new ApiError(httpStatus.BAD_REQUEST, commaSeparatedErrors);
  }

  let avatarUrl = null;

  if (req.file) {
    avatarUrl = storeAvatarFile({ file: req.file, userId: id });
  } else if (req.body.deleteavatar) {
    await deleteAvatarFile({ userModel, dbClient: req.dbClient, userId: id });
  }

  // throw new Error("prueba");

  await userModel.update({
    dbClient: req.dbClient,
    firstname,
    lastname,
    email,
    username,
    avatarUrl,
    role,
    id,
  });

  res.status(httpStatus.OK).send(`User modified with ID: ${id}`);
};

const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  await userModel.doDelete({
    dbClient: req.dbClient,
    id,
  });

  res.status(httpStatus.OK).send(`User deleted with ID: ${id}`);
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
