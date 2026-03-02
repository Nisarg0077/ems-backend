require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const {migrateDatabase} = require('./migrations/migrate');

const connectToDb = async () => {
  await migrateDatabase();
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE_NAME,
  });
  return db;
}

module.exports = {connectToDb}
