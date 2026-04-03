// src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Digunakan untuk inisiasi Transaction
const userModel = require('../models/userModel');
const sppgModel = require('../models/sppgModel');

/**
 * Handle Register User + SPPG Baru
 */
const register = async (req, res) => {
    const { username, password, email, no_telp, nama_sppg, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, alamat } = req.body;

    // 1. Validasi Input
    if (!username || !password || !email || !nama_sppg) {
        return res.status(400).json({ pesan: "Data wajib (Username, Password, Email, Nama SPPG) tidak boleh kosong!" });
    }

    const client = await pool.connect();

    try {
        // 2. Cek Duplikasi
        const existingUsers = await userModel.checkDuplicateUser(username, email);
        if (existingUsers.length > 0) {
            const isEmail = existingUsers.find(u => u.email === email);
            return res.status(400).json({ pesan: isEmail ? "Email sudah terdaftar!" : "Username sudah digunakan!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Proses Transaksi Database
        await client.query('BEGIN');

        // Simpan SPPG
        const sppgBaru = await sppgModel.createSppgTx(client, {
            nama_sppg, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, alamat
        });

        // Simpan User (Role 2 = KaSPPG)
        const userBaru = await userModel.createUserTx(client, {
            id_role: 2, id_sppg: sppgBaru.id_sppg, username, hashedPassword, email, no_telp
        });

        await client.query('COMMIT');

        // 4. Response Berhasil
        res.status(201).json({
            pesan: "Registrasi SPPG dan KaSPPG berhasil!",
            user: {
                id_user: userBaru.id_user,
                username: userBaru.username,
                nama_sppg: sppgBaru.nama_sppg
            }
        });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error("Error registrasi:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat registrasi" });
    } finally {
        client.release();
    }
};

/**
 * Handle Login User
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ pesan: "Username dan password wajib diisi!" });
        }

        // 1. Cek Ketersediaan User
        const user = await userModel.getUserByUsernameWithSppg(username);
        if (!user) return res.status(401).json({ pesan: "Username atau password salah!" });

        // 2. Validasi Password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ pesan: "Username atau password salah!" });

        // 3. Generate Token
        const token = jwt.sign(
            { id_user: user.id_user, id_role: user.id_role, id_sppg: user.id_sppg },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 4. Response Berhasil
        res.json({
            pesan: "Login berhasil!",
            token: token,
            user: {
                id_user: user.id_user,
                username: user.username,
                id_role: user.id_role,
                id_sppg: user.id_sppg,
                nama_sppg: user.nama_sppg, 
                alamat_sppg: user.alamat 
            }
        });

    } catch (error) {
        console.error("Error login:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat login" });
    }
};

module.exports = { register, login };