// 1. Memanggil library 'pg' untuk koneksi ke PostgreSQL
const { Pool } = require('pg');

// 2. Memanggil 'dotenv' agar kita bisa membaca file .env
require('dotenv').config();

// 3. Membuat pengaturan koneksi menggunakan data dari .env
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

// 4. Mengekspor (membagikan) jembatan ini agar bisa dipakai di file lain
module.exports = pool;