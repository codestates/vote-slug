require("express-async-errors");
const express = require("express");
const { User, Vote, Category, User_vote } = require("../models");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const auth = require("../controller/auth.js");
dotenv.config();
const router = express.Router();

// GLOBAL GET (모든 페이지에서 일어남)
// 토큰 검증
// 모든 페이지가 렌더링될 때마다, accessToken 및 refreshToken 검증
router.get("/", async (req, res) => {
  // authorization header 있는지 검증
  const { authorization } = req.headers;
  const { refreshToken } = req.cookies;
  try {
    if (!authorization) return res.sendStatus(401);

    const accessToken = authorization.split(" ")[1];
    let userData = jwt.verify(accessToken, process.env.JWT_ACCESS_KEY);
    let userInfo = await User.findOne({ where: { id: userData.id } });

    //accessToken과 refreshToken이 둘 다 만료된 경우 401
    if (!userInfo && !refreshToken)
      return res.status(401).json({ message: "token expired" });
    // accessToken은 만료 but refreshToken은 유효한 경우 -> accessToken 재발급
    else if (!userInfo && refreshToken) {
      userData = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
      const payload = { id: userData.id };
      const newAccessToken = jwt.sign(payload, process.env.JWT_ACCESS_KEY);
      return res.status(200).json({ newAccessToken });
    }
    // accessToken은 유효 but refreshToken은 만료된 경우 -> refreshToken 재발급
    else if (userInfo && !refreshToken) {
      const payload = { id: userData.id };
      const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_KEY);
      return res.status(200).json({ newRefreshToken });
    }
    // 그 외의 경우 (accessToken과 refreshToken 둘 다 유효한 경우)
    return res.sendStatus(200);
  } catch (err) {
    return res.sendStatus(500);
  }
});

// GET 유저 정보 조회(마이페이지)
router.get("/mypage", auth, async (req, res) => {
  const userId = req.userId;
  try {
    userInfo = await User.findOne({ where: { id: userId } });
    const { id, email, nickname, gender, dob, createdAt } = useInfo;
    return res
      .status(200)
      .json({ id, email, nickname, gender, dob, createdAt });
  } catch (err) {
    return res.sendStatus(500);
  }
});

// PATCH (회원정보 수정)
router.patch("/", auth, async (req, res) => {
  const userId = req.userId;
  const { password, newPassword, nickname } = req.body;
  try {
    // 유저가 입력한 패스워드 검증
    const isMatchPassword = await User.findOne({
      where: { id: userId, password },
    });
    if (!isMatchPassword)
      return res.status(401).json({ message: "wrong password" });
    // body로 newPassword가 들어왔을 때 비번 변경시켜줌.
    if (newPassword) {
      await User.update({ password: newPassword }, { where: { id: userId } });
      return res.sendStatus(200);
    }
    if (nickname) {
      await User.update({ nickname }, { where: { id: userId } });
      return res.sendStatus(200);
    }
  } catch (err) {
    return res.sendStatus(500);
  }
});

// DELETE (회원 탈퇴)
router.delete("/", auth, async (req, res) => {
  const userId = req.userId;
  try {
    await User.destroy({ where: { id: userId } });
    res.clearCookie("refreshToken");
    return res.status(200).redirect("/");
  } catch (err) {
    return res.sendStatus(500);
  }
});

// POST (회원가입)
router.post("/", async (req, res) => {
  const { email, password, nickname, gender, dob } = req.body;

  try {
    // email과 nickname 중복검사
    const emailResult = await User.findOne({ where: { email } });
    const nicknameResult = await User.findOne({ where: { nickname } });

    if (!emailResult) return res.status(409).json({ message: "email overlap" });
    if (!nicknameResult)
      return res.status(409).json({ message: "nickname overlap" });

    // email과 nickname 중복 아닐 시 정상적으로 db에 user정보 Insert
    await User.create({
      email,
      password,
      nickname,
      gender,
      dob,
    });

    return res.sendStatus(201);
  } catch (err) {
    return res.sendStatus(500);
  }
});

// 로그인 요청 (/user/login)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 가입된 이메일이 존재하는지 확인.
    const emailExist = await User.findOne({ where: { email } });
    if (!emailExist) return res.status(401).json({ message: "wrong email" });

    // 해당 이메일의 비밀번호가 일치하는지 확인.
    const user = await User.findOne({ where: { email, password } });
    if (!user) return res.status(401).json({ message: "wrong password" });

    // 회원 정보 일치 확인 -> jwt발급해줌.
    const payload = { id: user.id };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_KEY, {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_KEY, {
      expiresIn: "30d",
    });

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, {
        sameSite: "none",
        // secure: true,
        httpOnly: true,
      })
      .json({
        accessToken: accessToken,
        message: "login complete",
      });
  } catch (err) {
    return res.sendStatus(500);
  }
});

// 로그아웃 요청 (/user/logout)
router.post("/logout", async (req, res) => {
  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "logout complete" }).redirect("/");
});

// 자기가 게시한 투표 목록 조회 (/user/vote)
router.get("/vote", auth, async (req, res) => {
  const userId = req.userId;
  const { type } = req.query;

  // type이 posted인경우
  try {
    if (type === "posted") {
      const createdVoteList = await Vote.findAll({
        where: { userId },
        attributes: [
          "id", // voteId
          "voteTitle",
          "voteOption1",
          "voteOption2",
          "voteOption1Count",
          "voteOption2Count",
          "createdAt",
          "User.nickname", // author
          "Category.categoryTitle",
        ],
        include: [
          { model: Category, attributes: ["categoryTitle"] },
          { model: User, attributes: ["nickname"] },
        ],
      });

      return res.status(200).json({ createdVoteList });
    }

    if (type === "participated") {
      const participatedVoteList = await User_vote.findAll({
        where: { userId },
        attributes: [
          "voteOption1", // boolean 자기가 어디 투표했는지
          "voteOption2", // boolean 자기가 어디 투표했는지
          "Vote.voteTitle",
          "Vote.voteOption1Count",
          "Vote.voteOption2Count",
          "Vote.createdAt",
          "Vote.voteOption1", // 투표항목 1
          "Vote.voteOption2", // 투표항목 2
        ],
        include: [
          {
            model: Vote,
            include: [
              { model: Category, attributes: ["categoryTitle"] },
              { model: User, attributes: ["nickname"] },
            ],
          },
        ],
      });
      return res.status(200).json({ participatedVoteList });
    }
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

module.exports = router;
