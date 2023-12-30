const fs = require("fs");

const baseAvatarUploadDirectory = "public/uploads/avatar";

const storeAvatarFile = ({ file, userId }) => {
  const tmpFilepath = file.path;

  const userUploadDirectory = `${baseAvatarUploadDirectory}/${userId}/`;

  if (!fs.existsSync(userUploadDirectory)) {
    fs.mkdirSync(userUploadDirectory, { recursive: true });
  }

  const newFilepath = `${userUploadDirectory}${file.filename}`;

  fs.renameSync(tmpFilepath, newFilepath);

  return newFilepath;
};

const deleteAvatarFile = async ({ dbClient, userModel, userId }) => {
  const result = await userModel.getById({
    dbClient,
    id: userId,
  });

  console.log("deleteAvatarFile.result", result);

  const user = result?.rows?.[0];

  if (user?.avatar_url) {
    fs.unlinkSync(user.avatar_url);
  }
};

module.exports = {
  storeAvatarFile,
  deleteAvatarFile,
};
