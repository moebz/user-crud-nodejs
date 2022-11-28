const bcrypt = require('bcrypt');

const hashPassword = async (passwd) => {
  const saltRounds = 10;

  const salt = await bcrypt
    .genSalt(saltRounds);

  const passwordHash = bcrypt.hash(passwd, salt);

  return passwordHash;
};

module.exports = {
  hashPassword,
};