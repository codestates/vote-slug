"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User_vote extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.User_vote.belongsTo(models.User);
      models.User_vote.belongsTo(models.Vote);
    }
  }
  User_vote.init(
    {
      userId: DataTypes.INTEGER,
      voteId: DataTypes.INTEGER,
      voteOption1: DataTypes.BOOLEAN,
      voteOption2: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "User_vote",
    }
  );
  return User_vote;
};
