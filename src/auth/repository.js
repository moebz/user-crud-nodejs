const { knex } = require("../common/database");

const getUserByUsername = (username) =>
  knex("user_account").where("username", username).first();

const getRefreshTokenData = async ({ refreshToken }) => {
  const results = await knex("refresh_token")
    .select()
    .where("token_value", refreshToken);

  const refreshTokenData = results?.[0];

  return refreshTokenData;
};

const deleteRefreshToken = ({ refreshToken }) =>
  knex("refresh_token").where("token_value", refreshToken).del();

module.exports = {
  authRepository: {
    getUserByUsername,
    getRefreshTokenData,
    deleteRefreshToken,
  },
};
