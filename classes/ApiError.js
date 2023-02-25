class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    // This helps to capture the stack trace of the error from anywhere in the application.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
