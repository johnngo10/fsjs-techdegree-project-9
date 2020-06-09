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
      },
      lastName: {
        type: Sequelize.STRING,
      },
      emailAddress: {
        type: Sequelize.STRING,
      },
      password: {
        type: Sequelize.STRING,
      },
    },
    { sequelize }
  );

  User.associate = (models) => {
    // Add associations
    User.hasMany(models.Course, {
      as: "user", // alias
      foreignKey: { fieldName: "UserId", allowNull: false },
    });
  };

  return User;
};
