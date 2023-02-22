const { StatusCodes } = require("http-status-codes");
const ApiError = require("./ApiError");

class NotFoundError extends ApiError {
  constructor() {
    super(StatusCodes.NOT_FOUND, "The requested path was not found");
  }
}

module.exports = NotFoundError;
