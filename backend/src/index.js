// src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// 1. MIDDLEWARES
// Konfigurasi CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  // Menambahkan PATCH sesuai standar RESTful API
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], 
};

app.use(cors(corsOptions));
app.use(express.json());


// 2. ROUTES
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const menuRoutes = require('./routes/menuRoutes');
const giziRoutes = require('./routes/giziRoutes');
const barangRoutes = require('./routes/barangRoutes');
const penerimaRoutes = require('./routes/penerimaRoutes');
const poRoutes = require('./routes/poRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const sppgRoutes = require('./routes/sppgRoutes');

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/menu', menuRoutes);
app.use('/gizi', giziRoutes);
app.use('/barang', barangRoutes);
app.use('/penerima', penerimaRoutes);
app.use('/po', poRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/sppg', sppgRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('Halo! Server Backend Manajemen Stok Dapur sudah menyala!');
});

// 3. SERVER START
app.listen(port, () => {
  console.log(`[SERVER] Berhasil berjalan di http://localhost:${port}`);
});