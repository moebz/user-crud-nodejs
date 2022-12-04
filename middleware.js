const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { JWT_SECRET, JWT_EXPIRATION } = process.env;

const verifyUserToken = async (request, response, next) => {
  try {
    const token =
      request.headers["user-token"] ||
      request.body.userToken ||
      request.query.userToken;

    if (!token) {
      return response.status(403).send({ message: "No user token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    request.decodedUserToken = decoded;

    next();
  } catch (err) {
    console.log(err);
    return response
      .status(401)
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
  const fileUploadMiddleware = multerInstance.single("avatar");

  fileUploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError && err?.code === "LIMIT_FILE_SIZE") {
      return res.send({
        message: "Uploaded file size should be less than 2 MB",
      });
    } else if (err) {
      console.log(err);
      return res.send({
        message: "An unknown error occurred",
      });
    }
    next();
  });
};

module.exports = {
  verifyUserToken,
  fileUploadHandler,
};
