const jwt = require('jsonwebtoken');
const multer = require('multer');

const {
  JWT_SECRET,
  JWT_EXPIRATION,
} = process.env;

const verifyUserToken = async (request, response, next) => {
  try {
    const token = request.headers['user-token'] || request.body.userToken || request.query.userToken;
  
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

const multerStorageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const fileUpload = multer({ storage: multerStorageConfig });

module.exports = {
  verifyUserToken,
  fileUpload,
};