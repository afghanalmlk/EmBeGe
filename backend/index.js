const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Pastikan dotenv dipanggil di awal

const app = express();
const port = process.env.PORT || 5000;

// Konfigurasi CORS yang lebih aman (Production-Ready)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Sesuaikan URL frontend
  credentials: true, // Mengizinkan cookie/header otorisasi
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));
app.use(express.json());

// UPDATE 1
// Memanggil pelayan rute auth
const authRoutes = require('./routes/authRoutes');
// Memberitahu server untuk menggunakan rute tersebut dengan awalan '/auth'
app.use('/auth', authRoutes);

// UPDATE 2
const userRoutes = require('./routes/userRoutes');
app.use('/users', userRoutes);

// UPDATE 3
const menuRoutes = require('./routes/menuRoutes');
app.use('/menu', menuRoutes);

// UPDATE 4
const giziRoutes = require('./routes/giziRoutes');
app.use('/gizi', giziRoutes);

// UPDATE 5
const barangRoutes = require('./routes/barangRoutes');
app.use('/barang', barangRoutes);

// UPDATE 6
const penerimaRoutes = require('./routes/penerimaRoutes');
app.use('/penerima', penerimaRoutes);

// UPDATE 7
const poRoutes = require('./routes/poRoutes');
app.use('/po', poRoutes);

// UPDATE 8
const invoiceRoutes = require('./routes/invoiceRoutes');
app.use('/invoice', invoiceRoutes);

// UPDATE 9
const sppgRoutes = require('./routes/sppgRoutes');
app.use('/sppg', sppgRoutes);

app.get('/', (req, res) => {
  res.send('Halo! Server Backend Manajemen Stok Dapur sudah menyala!');
});

app.listen(port, () => {
  console.log(`Server berhasil berjalan di http://localhost:${port}`);
});