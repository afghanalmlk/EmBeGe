// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Konfigurasi koneksi database PostgreSQL menggunakan environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

// Export pool agar bisa digunakan di model untuk query database
module.exports = pool;