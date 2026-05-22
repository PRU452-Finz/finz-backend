'use strict';

const logger = require('./logger');

require('dotenv').config();

const { Sequelize } = require('sequelize');

const databaseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.info(msg) : false,
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
  timezone: '+07:00', // WIB
  define: {
    underscored: true,
  },
};

const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.username,
  databaseConfig.password,
  databaseConfig
);

sequelize.development = databaseConfig;
sequelize.test = databaseConfig;
sequelize.production = databaseConfig;

module.exports = sequelize;
