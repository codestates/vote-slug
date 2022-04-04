const { User, Vote, Category, User_vote } = require("../models");

module.exports = {
  get: async (req, res) => {
    const { categoryId } = req.query;
    try {
      if (categoryId && categoryId !== "1") {
        const selectedVoteList = await Vote.findAll({
          where: { categoryId: categoryId },
          attributes: [
            "id",
            "voteTitle",
            "voteOption1",
            "voteOption2",
            "voteOption1Count",
            "voteOption2Count",
            "createdAt",
            "User.nickname",
            "Category.categoryTitle",
          ],
          include: [
            { model: Category, attributes: ["categoryTitle"] },
            { model: User, attributes: ["nickname"] },
          ],
        });
        return res.status(200).json(selectedVoteList);
      }

      const voteList = await Vote.findAll({
        attributes: [
          "id",
          "voteTitle",
          "voteOption1",
          "voteOption2",
          "voteOption1Count",
          "voteOption2Count",
          "createdAt",
          "User.nickname",
          "Category.categoryTitle",
        ],
        include: [
          { model: Category, attributes: ["categoryTitle"] },
          { model: User, attributes: ["nickname"] },
        ],
      });
      return res.status(200).json(voteList);
    } catch (err) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  getById: async (req, res) => {
    const { voteId } = req.params;
    //GET
    try {
      if (voteId) {
        const selectedVote = await Vote.findByPk(voteId, {
          attributes: [
            "id",
            "voteTitle",
            "voteOption1",
            "voteOption2",
            "voteOption1Count",
            "voteOption2Count",
            "createdAt",
            "User.nickname",
            "Category.categoryTitle",
          ],
          include: [
            { model: Category, attributes: ["categoryTitle"] },
            { model: User, attributes: ["nickname"] },
          ],
        });
        return res.status(200).json(selectedVote);
      }
    } catch (err) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  post: async (req, res) => {
    // userId 필요
    const userId = req.userId;
    const { voteTitle, categoryId, voteOption1, voteOption2 } = req.body;

    try {
      await Vote.create({
        userId,
        voteTitle,
        categoryId,
        voteOption1,
        voteOption2,
      });
      return res.sendStatus(201);
    } catch (err) {
      console.log(err);
      return res.sendStatus(500);
    }
  },

  patch: async (req, res) => {
    const userId = req.userId;
    const { voteId, voteOption1, voteOption2 } = req.body;
    try {
      if (voteOption1) {
        await Vote.increment(
          { voteOption1Count: 1 },
          { where: { id: voteId } }
        );
        await User_vote.create({
          userId,
          voteId,
          voteOption1: true,
          voteOption2: false,
        });
        const participatedVote = await Vote.findByPk(voteId, {
          attributes: [
            "id",
            "voteTitle",
            "voteOption1",
            "voteOption2",
            "voteOption1Count",
            "voteOption2Count",
            "createdAt",
            "User.nickname",
            "Category.categoryTitle",
          ],
          include: [
            { model: Category, attributes: ["categoryTitle"] },
            { model: User, attributes: ["nickname"] },
          ],
        });

        return res.status(200).json(participatedVote);
      } else if (voteOption2) {
        await Vote.increment(
          { voteOption2Count: 1 },
          { where: { id: voteId } }
        );
        await User_vote.create({
          userId,
          voteId,
          voteOption1: false,
          voteOption2: true,
        });
        const participatedVote = await Vote.findByPk(voteId, {
          attributes: [
            "id",
            "voteTitle",
            "voteOption1",
            "voteOption2",
            "voteOption1Count",
            "voteOption2Count",
            "createdAt",
            "User.nickname",
            "Category.categoryTitle",
          ],
          include: [
            { model: Category, attributes: ["categoryTitle"] },
            { model: User, attributes: ["nickname"] },
          ],
        });

        return res.status(200).json(participatedVote);
      }
    } catch (err) {
      return res.sendStatus(500);
    }
  },

  delete: async (req, res) => {
    const { voteId } = req.params;

    try {
      await Vote.destroy({
        where: { id: voteId },
      });
      return res.status(200).json({ message: "deleted" });
    } catch (err) {
      return res.sendStatus(500);
    }
  },
};
