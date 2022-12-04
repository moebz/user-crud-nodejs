const bcrypt = require('bcrypt');
const {
	StatusCodes,
} = require('http-status-codes');

/**
 * It receives an express middleware, wraps it in a "try-catch" and returns it
 * to be executed by express.
 * If the middleware throws an error, sends it to the next middleware
 * (which is probably the custom error handler middleware).
 * It is used to avoid writing the same try-catch
 * that does this same process in every single middleware.
 * @param {*} fn 
 * @returns 
 */
const wrapMidd = (fn) => (req, res, next) => {  
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));  
};

const getErrorHandler = () => {
  return async (err, req, res, next) => {
    // If it is an instance of 'ApiError'
    // it could contain statusCode.
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

    res.status(statusCode).send({
      message: err.message,
      // stack: err.stack,
    });
  };
};

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
  wrapMidd,
  getErrorHandler,
  hashPassword,
  comparePasswords,
};