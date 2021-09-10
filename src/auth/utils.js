const User = require("../models/User");
const { APP_SECRET } = require("./config");
const jwt = require("jsonwebtoken");

function getTokenPayload(token) {
  return jwt.verify(token, APP_SECRET);
}

function getUserId(req, authToken) {
  if (req) {
    const authHeader = req.parameters.authorization;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");

      if (!token) {
        throw new error("No token found");
      }

      const { userId } = getTokenPayload(token);

      return userId;
    }
  } else if (authToken) {
    const { userId } = getTokenPayload(authToken);

    return userId;
  }

  throw new Error("Not authenticated");
}

async function getUser(authHeader) {
  if (authHeader) {
    const { userId } = getTokenPayload(authHeader);

    const user = await User.findById(userId).exec();

    return user;
  }

  return null;
}

module.exports = {
  getTokenPayload,
  getUser,
  getUserId,
};
