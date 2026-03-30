const bcrypt = require('bcrypt');
const pool = require('../db');

const getUsers = async (req, res) => {
    try {
        let queryStr = `
            SELECT u.id_user, u.username, u.email, u.no_telp, r.nama_role, s.nama_sppg 
            FROM users u 
            JOIN role r ON u.id_role = r.id_role 
            LEFT JOIN sppg s ON u.id_sppg = s.id_sppg
        `;
        let queryParams = [];

        // Jika bukan Superadmin, filter agar hanya melihat pegawai di SPPG yang sama
        if (req.user.id_role !== 1) {
            queryStr += ` WHERE u.id_sppg = $1`;
            queryParams.push(req.user.id_sppg);
        }

        queryStr += ` ORDER BY u.id_sppg ASC, r.id_role ASC`;

        const usersQuery = await pool.query(queryStr, queryParams);

        res.status(200).json({
            pesan: "Berhasil mengambil data pegawai",
            data: usersQuery.rows
        });
    } catch (error) {
        console.error("Error get users:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat mengambil data pegawai." });
    }
};

const addUser = async (req, res) => {
    try {
        let { username, password, email, no_telp, id_role, id_sppg } = req.body;
        const targetRole = Number(id_role);

        let targetSppg = req.user.id_sppg; 
        
        // --- 1. VALIDASI OTORISASI & TARGET SPPG ---
        if (req.user.id_role === 1) {
            // Superadmin wajib mengirimkan id_sppg tujuan
            if (!id_sppg) return res.status(400).json({ pesan: "Superadmin wajib memilih SPPG tujuan." });
            targetSppg = id_sppg;
        } else if (req.user.id_role === 2) {
            // KaSPPG HANYA boleh membuat Ahli Gizi (3) dan Akuntan (4)
            if (targetRole !== 3 && targetRole !== 4) {
                return res.status(403).json({ pesan: "Pelanggaran wewenang! Anda hanya bisa membuat akun untuk Ahli Gizi dan Akuntan." });
            }
        } else {
            return res.status(403).json({ pesan: "Akses ditolak! Anda tidak memiliki wewenang menambah pegawai." });
        }

        // --- 2. VALIDASI MAKSIMAL 1 PEGAWAI PER ROLE ---
        const cekRoleQuery = await pool.query(
            'SELECT id_user FROM users WHERE id_sppg = $1 AND id_role = $2',
            [targetSppg, targetRole]
        );
        if (cekRoleQuery.rows.length > 0) {
            return res.status(400).json({ pesan: "Posisi ini sudah terisi di SPPG tersebut! Maksimal 1 pegawai untuk setiap role." });
        }

        // --- 3. VALIDASI DUPLIKASI USERNAME & EMAIL ---
        const cekDuplikat = await pool.query(
            'SELECT username, email FROM users WHERE username = $1 OR email = $2', 
            [username, email]
        );
        if (cekDuplikat.rows.length > 0) {
            return res.status(400).json({ pesan: "Username atau Email tersebut sudah terdaftar di sistem!" });
        }

        // --- 4. PENENTUAN PASSWORD DEFAULT ---
        // Jika KaSPPG tidak mengisi password, gunakan default password "sppg123"
        const finalPassword = (!password || password.trim() === '') ? '1234' : password;
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(finalPassword, saltRounds);

        // --- 5. PROSES SIMPAN ---
        const newUserQuery = await pool.query(
            `INSERT INTO users (id_role, id_sppg, username, password, email, no_telp) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_user, username, email`,
            [targetRole, targetSppg, username, hashedPassword, email, no_telp]
        );

        res.status(201).json({
            pesan: `Akun Pegawai berhasil dibuat! ${!password ? '(Menggunakan Password Default: sppg123)' : ''}`,
            user: newUserQuery.rows[0]
        });
    } catch (error) {
        console.error("Error add user:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat membuat akun." });
    }
};

const editUser = async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        
        // Aturan: Hanya bisa mengedit profil sendiri (Kecuali Superadmin)
        if (req.user.id_user !== targetId && req.user.id_role !== 1) {
            return res.status(403).json({ pesan: "Anda hanya diizinkan mengubah data profil Anda sendiri." });
        }

        const { username, email, no_telp, password } = req.body;

        // Cek agar username/email yang baru tidak bentrok dengan milik orang lain
        const cekDuplikat = await pool.query(
            'SELECT id_user FROM users WHERE (username = $1 OR email = $2) AND id_user != $3', 
            [username, email, targetId]
        );
        if (cekDuplikat.rows.length > 0) {
            return res.status(400).json({ pesan: "Username atau Email sudah dipakai pengguna lain!" });
        }
        
        // Update database: Eksekusi Hash hanya jika password diganti
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET username=$1, email=$2, no_telp=$3, password=$4 WHERE id_user=$5', 
                [username, email, no_telp, hashedPassword, targetId]
            );
        } else {
            await pool.query(
                'UPDATE users SET username=$1, email=$2, no_telp=$3 WHERE id_user=$4', 
                [username, email, no_telp, targetId]
            );
        }
        
        res.status(200).json({ pesan: "Data Profil berhasil diperbarui!" });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan saat memperbarui profil." }); 
    }
};

const hapusUser = async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        
        const cekTarget = await pool.query('SELECT id_role, id_sppg FROM users WHERE id_user = $1', [targetId]);
        if (cekTarget.rows.length === 0) return res.status(404).json({ pesan: "User tidak ditemukan" });
        
        const dataTarget = cekTarget.rows[0];

        // Proteksi Superadmin
        if (dataTarget.id_role === 1) return res.status(403).json({ pesan: "Akun Superadmin tidak bisa dihapus." });

        if (req.user.id_role === 1) {
            // Superadmin bebas menghapus user mana saja
            await pool.query('DELETE FROM users WHERE id_user = $1', [targetId]);
            return res.json({ pesan: "Pegawai berhasil dihapus oleh Superadmin" });
        } else if (req.user.id_role === 2) {
            // KaSPPG hanya boleh hapus user di SPPG-nya sendiri
            if (dataTarget.id_sppg === req.user.id_sppg) {
                // Cegah KaSPPG menghapus akunnya sendiri (Data Suicide)
                if (targetId === req.user.id_user) return res.status(400).json({ pesan: "KaSPPG tidak dapat menghapus akunnya sendiri."});
                
                await pool.query('DELETE FROM users WHERE id_user = $1', [targetId]);
                return res.json({ pesan: "Pegawai SPPG berhasil dihapus" });
            } else {
                return res.status(403).json({ pesan: "Akses ditolak. Bukan pegawai dari SPPG Anda." });
            }
        }

        return res.status(403).json({ pesan: "Anda tidak memiliki wewenang untuk menghapus user." });
    } catch (error) { 
        res.status(500).json({ pesan: "Gagal menghapus! User masih terikat dengan data transaksi pembuatan Menu/PO/Invoice." }); 
    }
};

module.exports = { getUsers, addUser, editUser, hapusUser };