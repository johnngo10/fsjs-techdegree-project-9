"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");

const options = {
  dialect: "sqlite",
  storage: "fsjstd-restapi.db",
  define: {
    timestamps: false,
  },
};

const sequelize = new Sequelize(options);

const models = {};

// Import all models
fs.readdirSync(path.join(__dirname, "models")).forEach((file) => {
  console.info(`Importing database model from file: ${file}`);
  const model = sequelize.import(path.join(__dirname, "models", file));
  models[model.name] = model;
});

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    console.info(`Configuring the associations for the ${modelName} model...`);
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  Sequelize,
  models,
};
