'use strict';

const logger = require('./logger');

require('dotenv').config();

const { Sequelize } = require('sequelize');
const pg = require('pg'); // Wajib di-import eksplisit agar Vercel bundler membawanya ke serverless function

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

// Enable SSL/TLS for Supabase and other cloud PostgreSQL providers
const isCloudDb = 
  process.env.DB_SSL === 'true' || 
  (process.env.DB_HOST && (process.env.DB_HOST.includes('supabase') || process.env.DB_HOST.includes('supabase.co') || process.env.DB_HOST.includes('pooler.supabase.com'))) ||
  (process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('pooler.supabase.com')));

if (isCloudDb) {
  databaseConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

let sequelize;
if (process.env.DATABASE_URL) {
  const sequelizeOptions = {
    dialect: 'postgres',
    dialectModule: pg,
    logging: databaseConfig.logging,
    pool: databaseConfig.pool,
    timezone: databaseConfig.timezone,
    define: databaseConfig.define,
  };
  if (isCloudDb) {
    sequelizeOptions.dialectOptions = databaseConfig.dialectOptions;
  }
  sequelize = new Sequelize(process.env.DATABASE_URL, sequelizeOptions);
} else {
  sequelize = new Sequelize(
    databaseConfig.database,
    databaseConfig.username,
    databaseConfig.password,
    {
      ...databaseConfig,
      dialectModule: pg,
    }
  );
}

sequelize.development = databaseConfig;
sequelize.test = databaseConfig;
sequelize.production = databaseConfig;

module.exports = sequelize;
