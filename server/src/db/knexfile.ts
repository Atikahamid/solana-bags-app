import * as path from 'path';
import type { Knex } from 'knex';
// import dotenv from 'dotenv';
require('dotenv').config({path: '../../.env'});

// Use Knex.Config type (might need adjustment if default import changes things)
const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: "127.0.0.1",
      port: 5432,
      user: "postgres",
      password: "atika12345",
      database: "solana_app_kit",
    },
    migrations: {
      directory: path.resolve(__dirname, "migrations"), 
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: path.resolve(__dirname, "migrations"),
      extension: 'ts',
    },
   
    pool: { min: 2, max: 10 },
  },
};

export default config;
