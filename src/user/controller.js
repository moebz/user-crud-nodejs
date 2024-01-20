const httpStatus = require("http-status");

const { JoiLib, validate } = require("../common/validator");
const ApiError = require("../common/classes/ApiError");

const { userService } = require("./service");

const baseValidationFields = {
  firstname: JoiLib.string().required().label("First name"),
  lastname: JoiLib.string().required().label("Last name"),
  email: JoiLib.string().required().email().label("Email"),
  username: JoiLib.string().required().label("Username"),
};

const getUsers = async (req, res) => {
  const { pageSize, pageNumber, orderBy, orderDirection, filter } = req.query;

  console.log("getUsers.urlQuery", req.query);

  const result = await userService.getUsers({
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
  const validationFields = {
    id: JoiLib.string()
      .pattern(/^\d+$/)
      .messages({
        "string.pattern.name": "ID must be a string of digits",
      })
      .required()
      .label("ID"),
  };

  const { joiErrors, commaSeparatedErrors } = validate(
    req.params,
    validationFields
  );

  if (joiErrors) {
    throw new ApiError(httpStatus.BAD_REQUEST, commaSeparatedErrors);
  }

  const id = parseInt(req.params.id, 10);

  const user = await userService.getUserById(id);

  res.status(httpStatus.OK).send({ data: user, message: null });
};

const createUser = async (req, res) => {
  const validationFields = {
    ...baseValidationFields,
    // Only admins can use this endpoint, so they can specify the role.
    role: JoiLib.string().required().label("Role"),
    passwd: JoiLib.string().required().label("Password"),
    passwd_confirmation: JoiLib.any()
      .equal(JoiLib.ref("passwd"))
      .required()
      .label("Password confirmation")
      .messages({ "any.only": "{{#label}} does not match" }),
  };

  const { joiErrors, commaSeparatedErrors } = validate(
    req.body,
    validationFields,
    { allowUnknown: false }
  );

  if (joiErrors) {
    throw new ApiError(httpStatus.BAD_REQUEST, commaSeparatedErrors);
  }

  const insertedId = await userService.createUser({
    ...req.body,
    file: req.file,
  });

  return res
    .status(httpStatus.CREATED)
    .send({ message: `User added with ID: ${insertedId}` });
};

const updateUser = async (req, res) => {
  console.log("updateUser.req.body", req.body);

  const { joiErrors, commaSeparatedErrors } = validate(
    { ...req.body, id: req.params.id },
    baseValidationFields
  );

  if (joiErrors) {
    throw new ApiError(httpStatus.BAD_REQUEST, commaSeparatedErrors);
  }

  const id = parseInt(req.params.id, 10);
  const { firstname, lastname, email, username, role } = req.body;

  await userService.updateUser({
    id,
    firstname,
    lastname,
    email,
    username,
    role,
    file: req.file,
  });

  res.status(httpStatus.OK).send(`User modified with ID: ${id}`);
};

const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  await userService.doDelete({
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
