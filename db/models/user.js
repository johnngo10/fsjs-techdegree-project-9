"use strict";
const Sequelize = require("sequelize");

module.exports = (sequelize) => {
  class User extends Sequelize.Model {}
  User.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      emailAddress: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
        },
        // unique: {
        //   args: true,
        //   msg: "Email Address already exist.",
        // },
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    { sequelize }
  );

  User.associate = (models) => {
    // Add associations
    User.hasMany(models.Course, {
      as: "user", // alias
      foreignKey: { fieldName: "userId", allowNull: false },
    });
  };

  return User;
};
