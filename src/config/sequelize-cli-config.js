'use strict';

require('dotenv').config();

const config = {
  url: process.env.DATABASE_URL,
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

// Enable SSL/TLS for Supabase and other cloud PostgreSQL providers
const isCloudDb = 
  process.env.DB_SSL === 'true' || 
  (process.env.DB_HOST && (process.env.DB_HOST.includes('supabase') || process.env.DB_HOST.includes('supabase.co') || process.env.DB_HOST.includes('pooler.supabase.com'))) ||
  (process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('supabase.co') || process.env.DATABASE_URL.includes('pooler.supabase.com')));

if (isCloudDb) {
  config.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

module.exports = {
  development: config,
  test: config,
  production: config,
};
