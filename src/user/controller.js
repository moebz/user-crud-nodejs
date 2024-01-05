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

  const user = await userModel.getById({
    id,
  });

  res.status(httpStatus.OK).send({ data: user, message: null });
};

const createUser = async (req, res) => {

  console.log("1");

  const { firstname, lastname, email, username, passwd, role } = req.body;

  console.log("2");

  const validationFields = {
    ...baseValidationFields,
    passwd: JoiLib.string().required().label("Password"),
    passwd_confirmation: JoiLib.any()
      .equal(JoiLib.ref("passwd"))
      .required()
      .label("Password confirmation")
      .messages({ "any.only": "{{#label}} does not match" }),
  };

  console.log("3");

  const { joiErrors, commaSeparatedErrors } = validate(
    req.body,
    validationFields
  );

  console.log("4");

  if (joiErrors) {
    throw new ApiError(httpStatus.BAD_REQUEST, commaSeparatedErrors);
  }

  console.log("5");

  const passwordHash = await hashPassword(passwd);

  console.log("6");

  const result = await userModel.create({
    firstname,
    lastname,
    email,
    username,
    passwordHash,
    role,
  });

  console.log("7");

  console.log({ result });

  const insertedId = result.id;

  // Move avatar image
  // from tmp dir to public dir
  // and save the public path
  // in the db.

  console.log("8");

  if (req.file) {
    const filepath = storeAvatarFile({
      file: req.file,
      userId: insertedId,
    });

    await userModel.update({
      avatarUrl: filepath,
      id: insertedId,
    });
  }

  console.log("9");

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
    await deleteAvatarFile({ userModel, userId: id });
  }

  // throw new Error("prueba");

  await userModel.update({
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
