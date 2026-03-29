const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const register = async (req, res) => {
    try {
        // 1. Menangkap data formulir (sekarang sudah lengkap dengan hierarki wilayah)
        const { 
            username, password, email, no_telp, 
            nama_sppg, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, alamat 
        } = req.body;

        // 2. Mengacak password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Menyimpan data SPPG dengan kolom wilayah yang baru
        const sppgQuery = await pool.query(
            'INSERT INTO sppg (nama_sppg, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, alamat) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_sppg',
            [nama_sppg, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, alamat]
        );
        const id_sppg_baru = sppgQuery.rows[0].id_sppg;

        // 4. Menyimpan data User baru.
        // PENTING: Sekarang id_role untuk KaSPPG adalah 2 (karena 1 adalah Superadmin)
        const userQuery = await pool.query(
            'INSERT INTO users (id_role, id_sppg, username, password, email, no_telp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_user, username',
            [2, id_sppg_baru, username, hashedPassword, email, no_telp]
        );

        // 5. Mengirim jawaban sukses ke layar pengguna
        res.status(201).json({
            pesan: "Registrasi SPPG dan KaSPPG berhasil!",
            user: userQuery.rows[0]
        });

    } catch (error) {
        console.error("Error saat registrasi:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat registrasi" });
    }
};

// UPDATE 1
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Mencari user di database berdasarkan username
        const userQuery = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        // Jika user tidak ditemukan
        if (userQuery.rows.length === 0) {
            return res.status(401).json({ pesan: "Username atau password salah!" });
        }

        const user = userQuery.rows[0];

        // 2. Mencocokkan password yang diketik dengan password di database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        // Jika password salah
        if (!isPasswordValid) {
            return res.status(401).json({ pesan: "Username atau password salah!" });
        }

        // 3. Jika benar, buat Token (KTP Digital)
        // Kita titipkan id_user, id_role, dan id_sppg di dalam token ini
        const token = jwt.sign(
            { id_user: user.id_user, id_role: user.id_role, id_sppg: user.id_sppg },
            process.env.JWT_SECRET, // Menggunakan kunci rahasia dari .env
            { expiresIn: '1d' } // Token ini akan hangus/kadaluarsa dalam 1 hari
        );

        // 4. Kirim jawaban sukses beserta tokennya
        res.json({
            pesan: "Login berhasil!",
            token: token,
            user: {
                id_user: user.id_user,
                username: user.username,
                id_role: user.id_role,
                id_sppg: user.id_sppg
            }
        });

    } catch (error) {
        console.error("Error saat login:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat login" });
    }
};

// Jangan lupa ekspor juga fungsi login-nya!
module.exports = { register, login };