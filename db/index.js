"use strict";

const path = require("path");
const Sequelize = require("sequelize");

const options = {
  dialect: "sqlite",
  storage: "fsjstd-restapi.db",
};

const sequelize = new Sequelize(options);

module.exports = {
  sequelize,
  Sequelize,
};
