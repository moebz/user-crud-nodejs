const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const httpStatus = require("http-status");

require("dotenv").config();
const { db } = require("./database");

// console.log = function () {};

const { JWT_SECRET, JWT_EXPIRATION } = process.env;

const verifyUserToken = async (request, response, next) => {
  try {
    const token =
      request.headers["user-token"] ||
      request.body.userToken ||
      request.query.userToken;

    if (!token) {
      return response
        .status(httpStatus.UNAUTHORIZED)
        .send({ message: "No user token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    request.decodedUserToken = decoded;

    next();
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
    } else if (err) {
      // console.log('fileUploadHandler.err', err);
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "An unknown error occurred",
      });
    }
    next();
  });
};

const getDbClient = async (req, res, next) => {
  const client = await db.getClient();
  req.dbClient = client;
  next();
};

module.exports = {
  verifyUserToken,
  fileUploadHandler,
  getDbClient,
};
