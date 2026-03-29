// 1. Memanggil library yang dibutuhkan
const express = require('express');
const cors = require('cors');

// 2. Membuat aplikasi Express
const app = express();
const port = 5000; // Menentukan 'nomor pintu' server

// 3. Mengaktifkan Middleware (penengah)
app.use(cors()); // Mengizinkan frontend mengakses backend kita
app.use(express.json()); // Membantu server membaca data yang dikirim dalam format JSON

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

app.get('/', (req, res) => {
  res.send('Halo! Server Backend Manajemen Stok Dapur sudah menyala!');
});

app.listen(port, () => {
  console.log(`Server berhasil berjalan di http://localhost:${port}`);
});