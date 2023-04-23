/* eslint-disable no-console */
const httpStatus = require("http-status");

/**
 * It receives an express middleware, wraps it in a "try-catch" and returns it
 * to be executed by express. It does two things:
 * 1- If the middleware throws an error, sends it to the next middleware
 * (which is probably the custom error handler middleware).
 * 2- Ensures that if a dbClient is present, release is called on it.
 * It is used to avoid writing the same try-catch
 * that does this same process in every single middleware.
 * @param {*} fn
 * @returns
 */
const wrapMidd = (fn, config) => {
  // Disconnect from db unless explicitly told not to
  // (in case the next middleware uses the connection)
  const disconnectFromDb = config ? config.disconnectFromDb : true;

  return async (req, res, next) => {
    // console.log({ "wrapMidd.req": Object.getOwnPropertyNames(req) });
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    } finally {
      if (disconnectFromDb && req.dbClient) {
        try {
          req.dbClient.release();
        } catch (releaseError) {
          console.err("releaseError", releaseError);
        }
      }
    }
  };
};

// eslint-disable-next-line no-unused-vars
const errorHandler = async (err, req, res, next) => {
  console.log("mainErrorHandler.err", err);

  // if (req.dbClient) {
  //   dbClient.release();
  // }

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
