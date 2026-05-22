'use strict';

require('dotenv').config();

const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  timezone: '+07:00',
  define: {
    underscored: true,
  },
};

module.exports = {
  development: config,
  test: config,
  production: config,
};
