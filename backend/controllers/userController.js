const bcrypt = require('bcrypt');
const pool = require('../db');

// Fungsi untuk melihat daftar user di SPPG yang sama
const getUsers = async (req, res) => {
    try {
        // Mengambil id_sppg dari token (KTP Digital) user yang sedang login
        const sppg_id = req.user.id_sppg;

        // Mencari semua user yang id_sppg-nya sama dengan sppg_id ini
        // Kita tidak mengambil password demi keamanan
        const usersQuery = await pool.query(
            `SELECT users.id_user, users.username, users.email, users.no_telp, role.nama_role 
             FROM users 
             JOIN role ON users.id_role = role.id_role 
             WHERE users.id_sppg = $1`,
            [sppg_id]
        );

        res.json({
            pesan: "Berhasil mengambil data pegawai",
            data: usersQuery.rows
        });
    } catch (error) {
        console.error("Error saat mengambil data user:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" });
    }
};

// Fungsi untuk KaSPPG menambahkan pegawai baru (Ahli Gizi / Akuntan)
const addUser = async (req, res) => {
    try {
        const sppg_id = req.user.id_sppg; 
        const role_pembuat = req.user.id_role; // Mengambil jabatan orang yang sedang login

        // GERBANG 1: Hanya KaSPPG (Role 2) yang boleh menambah pegawai di SPPG-nya
        if (role_pembuat !== 2) {
            return res.status(403).json({ pesan: "Akses ditolak! Hanya KaSPPG yang dapat menambah pegawai." });
        }

        const { username, password, email, no_telp, id_role } = req.body;

        // GERBANG 2: Tidak boleh membuat Superadmin (1) atau KaSPPG ganda (2)
        // Pastikan id_role diubah jadi angka (Number) untuk pengecekan
        const targetRole = Number(id_role);
        if (targetRole === 1 || targetRole === 2) {
            return res.status(403).json({ pesan: "Pelanggaran wewenang! Anda tidak diizinkan membuat akun setingkat atau di atas Anda." });
        }

        // GERBANG 3: Cek apakah role tersebut sudah terisi di SPPG ini (Maksimal 1)
        const cekRoleQuery = await pool.query(
            'SELECT id_user FROM users WHERE id_sppg = $1 AND id_role = $2',
            [sppg_id, targetRole]
        );

        if (cekRoleQuery.rows.length > 0) {
            return res.status(400).json({ pesan: "Posisi ini sudah terisi di Dapur Anda! Maksimal 1 pegawai untuk setiap posisi." });
        }

        // Jika lolos semua gerbang, baru kita proses pembuatannya
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUserQuery = await pool.query(
            `INSERT INTO users (id_role, id_sppg, username, password, email, no_telp) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_user, username`,
            [targetRole, sppg_id, username, hashedPassword, email, no_telp]
        );

        res.status(201).json({
            pesan: "Pegawai baru berhasil ditambahkan secara aman!",
            user: newUserQuery.rows[0]
        });
    } catch (error) {
        console.error("Error saat menambah pegawai:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" });
    }
};

const editUser = async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        // Aturan: Hanya bisa mengedit diri sendiri (kecuali kamu mau buat fitur Superadmin edit orang lain)
        if (req.user.id_user !== targetId) return res.status(403).json({ pesan: "Anda hanya bisa mengedit profil Anda sendiri." });

        const { username, email, no_telp, password } = req.body;
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET username=$1, email=$2, no_telp=$3, password=$4 WHERE id_user=$5', [username, email, no_telp, hashedPassword, targetId]);
        } else {
            await pool.query('UPDATE users SET username=$1, email=$2, no_telp=$3 WHERE id_user=$4', [username, email, no_telp, targetId]);
        }
        res.json({ pesan: "Profil berhasil diperbarui!" });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

const hapusUser = async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        
        // Superadmin kebal dari penghapusan
        const cekTarget = await pool.query('SELECT id_role, id_sppg FROM users WHERE id_user = $1', [targetId]);
        if (cekTarget.rows.length === 0) return res.status(404).json({ pesan: "User tidak ditemukan" });
        if (cekTarget.rows[0].id_role === 1) return res.status(403).json({ pesan: "Superadmin tidak bisa dihapus." });

        if (req.user.id_role === 1) {
            // Superadmin bisa hapus siapa saja
            await pool.query('DELETE FROM users WHERE id_user = $1', [targetId]);
            return res.json({ pesan: "User berhasil dihapus oleh Superadmin" });
        } 
        
        if (req.user.id_role === 2) {
            // KaSPPG (Role 2) hanya bisa hapus user di SPPG yang sama
            if (cekTarget.rows[0].id_sppg === req.user.id_sppg) {
                await pool.query('DELETE FROM users WHERE id_user = $1', [targetId]);
                return res.json({ pesan: "Pegawai SPPG berhasil dihapus" });
            } else {
                return res.status(403).json({ pesan: "Akses ditolak. Berbeda SPPG." });
            }
        }

        return res.status(403).json({ pesan: "Anda tidak memiliki wewenang menghapus user." });
    } catch (error) { res.status(500).json({ pesan: "Error server. User mungkin masih terikat dengan data transaksi." }); }
};

module.exports = { getUsers, addUser, editUser, hapusUser };