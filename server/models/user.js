"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.User.hasMany(models.Vote, { foreignKey: "userId" });
      models.User.hasMany(models.User_vote, { foreignKey: "userId" });
      models.User.belongsToMany(models.Vote, {
        through: "User_vote",
        targetKey: "id",
        foreignKey: "userId",
      });
    }
  }
  User.init(
    {
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      nickname: DataTypes.STRING,
      gender: DataTypes.STRING,
      dob: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
