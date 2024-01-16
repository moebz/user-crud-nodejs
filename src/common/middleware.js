const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const httpStatus = require("http-status");

require("dotenv").config();
const { db } = require("./database");
const ApiError = require("./classes/ApiError");

// console.log = function () {};

const { JWT_SECRET } = process.env;

const verifyAccessToken = async (request, response, next) => {
  try {
    const token =
      request.headers["access-token"] ||
      request.body.accessToken ||
      request.query.accessToken;

    if (!token) {
      return response
        .status(httpStatus.UNAUTHORIZED)
        .send({ message: "No user token provided." });
    }

    console.log("verifyAccessToken.rawToken", token);

    const decoded = jwt.verify(token, JWT_SECRET);

    console.log("verifyAccessToken.decoded", decoded);

    if (!decoded?.role) {
      // The access token must have a role field.
      // This verification is needed just in case a malicious user
      // tries to use the refresh token as an
      // access token.
      throw new Error("There was an error while processing the token");
    }

    request.decodedAccessToken = decoded;

    return next();
  } catch (err) {
    console.log(err);
    return response
      .status(httpStatus.UNAUTHORIZED)
      .send({ message: "Failed to authenticate user token." });
  }
};

const destinationHandler = (req, file, cb) => {
  const tmpDirectory = "./tmp-uploads/";
  if (!fs.existsSync(tmpDirectory)) {
    fs.mkdirSync(tmpDirectory, { recursive: true });
  }
  cb(null, tmpDirectory);
};

const filenameHandler = (req, file, cb) => {
  const originalName = file.originalname;
  const extension = path.parse(originalName).ext;
  const nameWithoutExtension = path.parse(originalName).name;
  const currentTimestamp = new Date().getTime();
  const tmpFilename = `${nameWithoutExtension}_${currentTimestamp}${extension}`;
  cb(null, tmpFilename);
};

const multerStrgEngineConf = {
  destination: destinationHandler,
  filename: filenameHandler,
};

const multerStorageEngine = multer.diskStorage(multerStrgEngineConf);

const multerInstance = multer({
  storage: multerStorageEngine,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
});

const fileUploadHandler = (req, res, next) => {
  // console.log({'fileUploadHandler.req': Object.getOwnPropertyNames(req)});

  const fileUploadMiddleware = multerInstance.single("avatar");

  fileUploadMiddleware(req, res, (err) => {
    // console.log({'fileUploadMiddleware.req': Object.getOwnPropertyNames(req)});

    // console.log('fileUploadMiddleware.err', err);
    if (err instanceof multer.MulterError && err?.code === "LIMIT_FILE_SIZE") {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "Uploaded file size should be less than 2 MB",
      });
    }

    if (err) {
      // console.log('fileUploadHandler.err', err);
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "An unknown error occurred",
      });
    }

    return next();
  });
};

// Returns a middleware that will throw an error
// if the user role isn't included in the allowedRoles list.
const allowOnlyTheseRoles = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles || !allowedRoles.includes(req.decodedAccessToken.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, "Access restricted");
  }
  next();
};

module.exports = {
  verifyAccessToken,
  fileUploadHandler,
  allowOnlyTheseRoles,
};
