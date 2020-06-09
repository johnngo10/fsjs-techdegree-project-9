"use strict";
const Sequelize = required("sequelize");

module.exports = (sequelize) => {
  class Course extends Sequelize.Model {}
  Course.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      estimatedTime: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      materialsNeeded: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    },
    { sequelize }
  );

  Course.associate = (models) => {
    // Add associations
    Course.belongsTo(models.User, {
      as: "user", // alias
      foreignKey: { fieldName: "UserId", allowNull: false },
    });
  };

  return Course;
};
