/* eslint-disable no-console */
const httpStatus = require("http-status");

/**
 * It receives an express middleware, wraps it in a "try-catch" and returns it
 * to be executed by express. If the middleware throws an error, sends it to the next middleware
 * (which is probably the custom error handler middleware).
 * @param {*} fn
 * @returns
 */
const wrapMidd = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    next(err);
  }
};

// eslint-disable-next-line no-unused-vars
const errorHandler = async (err, req, res, next) => {
  console.log("mainErrorHandler.err", err);

  // If it is an instance of 'ApiError'
  // it could contain statusCode.
  const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;

  res.status(statusCode).send({
    message: err.message,
    // stack: err.stack,
  });
};

module.exports = {
  wrapMidd,
  errorHandler,
};
