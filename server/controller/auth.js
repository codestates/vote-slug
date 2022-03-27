const jwt = require("jsonwebtoken");
const { User } = require("../models");

const auth = async (req, res, next) => {
  // accessToken
  const { authorization } = req.headers;
  try {
    if (!authorization) return res.sendStatus(401);

    const accessToken = authorization.split(" ")[1];
    let userData = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
    let userInfo = await User.findOne({ where: { id: userData.id } });

    // 유저 not found or jwt에러면 catch에서 잡을수 있음.
    if (!userInfo) return res.status(404).json({ message: "user not found" });
    req.userId = userInfo.id;
    next();
  } catch (err) {
    // 어떤오류인지 분기를 나누기 (토큰 에러일 경우)
    console.log(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "jwt token err" });
    }
    return res.sendStatus(500);
  }
};

module.exports = auth;
