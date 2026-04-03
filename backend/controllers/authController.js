const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const register = async (req, res) => {
    // Validasi Input Dasar (Mencegah payload kosong/tidak lengkap)
    const { 
        username, password, email, no_telp, 
        nama_sppg, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, alamat 
    } = req.body;

    if (!username || !password || !email || !nama_sppg) {
        return res.status(400).json({ pesan: "Data wajib (Username, Password, Email, Nama SPPG) tidak boleh kosong!" });
    }

    const client = await pool.connect();

    try {
        // Cek duplikasi Username ATAU Email
        const checkUser = await client.query(
            'SELECT username, email FROM users WHERE username = $1 OR email = $2', 
            [username, email]
        );
        
        if (checkUser.rows.length > 0) {
            const isEmail = checkUser.rows.find(u => u.email === email);
            return res.status(400).json({ 
                pesan: isEmail ? "Email sudah terdaftar!" : "Username sudah digunakan!" 
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // ==========================================
        // TRANSAKSI DIMULAI
        // ==========================================
        await client.query('BEGIN');

        // 1. Simpan Data SPPG
        const sppgQuery = await client.query(
            'INSERT INTO sppg (nama_sppg, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, alamat) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_sppg, nama_sppg',
            [nama_sppg, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, alamat]
        );
        const id_sppg_baru = sppgQuery.rows[0].id_sppg;

        // 2. Simpan Data User (Role 2 = KaSPPG)
        const userQuery = await client.query(
            'INSERT INTO users (id_role, id_sppg, username, password, email, no_telp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_user, username',
            [2, id_sppg_baru, username, hashedPassword, email, no_telp]
        );

        await client.query('COMMIT');

        res.status(201).json({
            pesan: "Registrasi SPPG dan KaSPPG berhasil!",
            user: {
                id_user: userQuery.rows[0].id_user,
                username: userQuery.rows[0].username,
                nama_sppg: sppgQuery.rows[0].nama_sppg
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

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ pesan: "Username dan password wajib diisi!" });
        }

        // Ambil data user beserta nama SPPG-nya (BERGUNA UNTUK UI FRONTEND)
        const userQuery = await pool.query(`
            SELECT u.*, s.nama_sppg, s.alamat 
            FROM users u 
            LEFT JOIN sppg s ON u.id_sppg = s.id_sppg 
            WHERE u.username = $1
        `, [username]);

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ pesan: "Username atau password salah!" });
        }

        const user = userQuery.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ pesan: "Username atau password salah!" });
        }

        const token = jwt.sign(
            { id_user: user.id_user, id_role: user.id_role, id_sppg: user.id_sppg },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

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