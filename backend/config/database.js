const mysql = require('mysql2');
require('dotenv').config();

// Vytvorenie connection pool pre lepší výkon
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Promise wrapper pre jednoduchšie používanie
const promisePool = pool.promise();

// Test pripojenia
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Chyba pri pripájaní k databáze:', err.message);
    return;
  }
  console.log('✅ Úspešne pripojené k MySQL databáze');
  connection.release();
});

module.exports = promisePool;
