require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

const connectToServer = async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true,
  });
  return connection;
}

const migrateDatabase = async () => {
  try {
    const sqlPath = path.join(__dirname, './db_backup.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    const connection = await connectToServer();
    await connection.query(sqlScript);
    console.log('✅ Database and tables ready.');
    await connection.end();
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

module.exports = { migrateDatabase}
