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

const deleteAvatarFile = async ({ userModel, userId }) => {
  const user = await userModel.getById({
    id: userId,
  });

  console.log("deleteAvatarFile.user", user);

  if (user?.avatar_url) {
    fs.unlinkSync(user.avatar_url);
  }
};

module.exports = {
  storeAvatarFile,
  deleteAvatarFile,
};
