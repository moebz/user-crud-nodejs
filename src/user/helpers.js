const fs = require("fs");

const storeAvatarFile = ({ file, userId }) => {
  const tmpFilepath = file.path;

  const userUploadDirectory = `public/uploads/avatar/${userId}/`;

  if (!fs.existsSync(userUploadDirectory)) {
    fs.mkdirSync(userUploadDirectory, { recursive: true });
  }

  const newFilepath = `${userUploadDirectory}${file.filename}`;

  fs.renameSync(tmpFilepath, newFilepath);

  return newFilepath;
};

module.exports = {
  storeAvatarFile,
};
