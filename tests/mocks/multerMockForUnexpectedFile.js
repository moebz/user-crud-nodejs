const oMulter = require("multer");

const diskStorage = function () {};

const memoryStorage = function () {};

function Multer(options) {
  if (options.storage) {
    this.storage = options.storage;
  } else if (options.dest) {
    this.storage = diskStorage({ destination: options.dest });
  } else {
    this.storage = memoryStorage();
  }
}

Multer.prototype.single = function () {
  return function (req, res, errorCallback) {
    const multerError = new oMulter.MulterError("LIMIT_UNEXPECTED_FILE");
    errorCallback(multerError);
  };
};

function multer(options) {
  if (options === undefined) {
    return new Multer({});
  }

  if (typeof options === "object" && options !== null) {
    return new Multer(options);
  }

  throw new TypeError("Expected object for argument options");
}

module.exports = multer;
module.exports.diskStorage = diskStorage;
module.exports.memoryStorage = memoryStorage;
module.exports.MulterError = oMulter.MulterError;
