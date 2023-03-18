const httpStatus = require("http-status");
const ApiError = require("./ApiError");

class NotFoundError extends ApiError {
  constructor() {
    super(httpStatus.NOT_FOUND, "The requested path was not found");
  }
}

module.exports = NotFoundError;
