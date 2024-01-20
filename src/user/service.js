const { authHelpers } = require("../auth/helpers");
const { userHelpers } = require("./helpers");
const { userRepository } = require("./repository");

const getUsers = async ({
  pageSize,
  pageNumber,
  orderBy,
  orderDirection,
  filter,
}) => {
  const result = await userRepository.get({
    pageSize,
    pageNumber,
    orderBy,
    orderDirection,
    filter,
  });

  return {
    rows: result.rows,
    total: result.total,
  };
};

const getUserById = async (id) => {
  const user = await userRepository.getById({
    id,
  });

  return user;
};

const createUser = async ({
  firstname,
  lastname,
  email,
  username,
  passwd,
  role,
  file,
}) => {
  // Save user's data in db.

  const passwordHash = await authHelpers.hashPassword(passwd);

  const result = await userRepository.create({
    firstname,
    lastname,
    email,
    username,
    passwordHash,
    role,
  });

  const insertedId = result.id;

  // Save user's avatar in filesystem and db.

  if (!file) {
    return insertedId;
  }

  const filepath = userHelpers.storeAvatarFile({
    file,
    userId: insertedId,
  });

  await userRepository.update({
    avatarUrl: filepath,
    id: insertedId,
  });

  return insertedId;
};

const updateUser = async ({
  firstname,
  lastname,
  email,
  username,
  role,
  id,
  file,
  deleteavatar,
}) => {
  let avatarUrl = null;

  if (file) {
    avatarUrl = userHelpers.storeAvatarFile({ file, userId: id });
  } else if (deleteavatar) {
    await userHelpers.deleteAvatarFile({ userRepository, userId: id });
  }

  await userRepository.update({
    firstname,
    lastname,
    email,
    username,
    avatarUrl,
    role,
    id,
  });
};

const doDelete = (id) => userRepository.doDelete({ id });

module.exports = {
  userService: {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    doDelete,
  },
};
