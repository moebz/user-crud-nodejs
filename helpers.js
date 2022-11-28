const bcrypt = require('bcrypt');

const hashPassword = async (passwd) => {
  const saltRounds = 10;

  const salt = await bcrypt
    .genSalt(saltRounds);

  const passwordHash = bcrypt.hash(passwd, salt);

  return passwordHash;
};

const comparePasswords = async (clearTextPassword, hashedPassword) => {
  return bcrypt.compare(clearTextPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePasswords,
};