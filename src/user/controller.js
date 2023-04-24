const httpStatus = require("http-status");
const fs = require("fs");

const { hashPassword } = require("../auth/helpers");

const {
  JoiLib,
  validateRequest,
  getCommaSeparatedErrors,
} = require("../common/validator");
const ApiError = require("../common/classes/ApiError");

const { userModel } = require("./model");

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

  const result = await userModel.get({
    dbClient: req.dbClient,
    pageSize,
    pageNumber,
    orderBy,
    orderDirection,
    filter,
  });

  res.status(httpStatus.OK).json({
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

  const tmpUploadDirectory = req?.file?.path;

  if (tmpUploadDirectory) {
    const userUploadDirectory = `public/uploads/avatar/${insertedId}/`;

    if (!fs.existsSync(userUploadDirectory)) {
      fs.mkdirSync(userUploadDirectory, { recursive: true });
    }

    const fullNewFilepath = `${userUploadDirectory}${req.file.filename}`;

    fs.renameSync(req.file.path, fullNewFilepath);

    await userModel.update({
      dbClient: req.dbClient,
      avatarUrl: fullNewFilepath,
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
