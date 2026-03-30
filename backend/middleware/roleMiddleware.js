// backend/middleware/roleMiddleware.js
const pool = require('../db');

// Fungsi pembungkus (Factory Function) agar bisa menerima parameter
const authorizeSPPG = (tableName, idColumnName) => {
    return async (req, res, next) => {
        try {
            const userRole = req.user.id_role;
            const userSppg = req.user.id_sppg;
            const resourceId = req.params.id; // Mengambil ID dari URL (contoh: /po/5)

            // 1. Superadmin (Role 1) bebas akses ke mana saja
            if (userRole === 1) {
                return next();
            }

            // 2. Cek kepemilikan data untuk pegawai SPPG
            // Kita join tabel target dengan tabel users untuk melihat id_sppg pembuatnya
            const query = `
                SELECT u.id_sppg 
                FROM ${tableName} t
                JOIN users u ON t.created_by = u.id_user
                WHERE t.${idColumnName} = $1
            `;
            
            const cek = await pool.query(query, [resourceId]);

            // Jika data yang mau diedit/dihapus tidak ditemukan di database
            if (cek.rows.length === 0) {
                return res.status(404).json({ pesan: "Data tidak ditemukan." });
            }

            // Jika SPPG pembuat data TIDAK SAMA dengan SPPG user yang sedang login
            if (cek.rows[0].id_sppg !== userSppg) {
                return res.status(403).json({ pesan: "Akses ditolak. Ini bukan data milik SPPG Anda!" });
            }

            // 3. Jika lolos semua validasi, persilakan masuk ke Controller
            next();
            
        } catch (error) {
            console.error(`Error Otorisasi di tabel ${tableName}:`, error.message);
            res.status(500).json({ pesan: "Terjadi kesalahan server saat memvalidasi otorisasi akses." });
        }
    };
};

// Tambahkan fungsi khusus Superadmin
const requireSuperadmin = (req, res, next) => {
    if (req.user.id_role !== 1) {
        return res.status(403).json({ pesan: "Akses ditolak. Fitur ini hanya untuk Superadmin." });
    }
    next();
};

// 1. Satpam untuk memblokir Akuntan (Role 4) dari aksi Tambah/Ubah/Hapus
const forbidAkuntan = (req, res, next) => {
    // Asumsi: Role 4 = Akuntan
    if (req.user.id_role === 4) {
        return res.status(403).json({ pesan: "Akses ditolak. Akuntan hanya diperbolehkan melihat data." });
    }
    next();
};

const forbidGiziAndAkuntan = (req, res, next) => {
    // Role 3 = Ahli Gizi, Role 4 = Akuntan
    if (req.user.id_role === 3 || req.user.id_role === 4) {
        return res.status(403).json({ pesan: "Akses ditolak. Ahli Gizi dan Akuntan hanya diizinkan melihat data." });
    }
    next();
};

const forbidAhliGizi = (req, res, next) => {
    // Role 3 = Ahli Gizi
    if (req.user.id_role === 3) {
        return res.status(403).json({ pesan: "Akses ditolak. Ahli Gizi hanya diperbolehkan melihat data PO." });
    }
    next();
};

// 2. Satpam untuk memvalidasi Relasi Gizi -> Menu -> Users -> SPPG (Untuk Edit & Hapus)
const authorizeGizi = async (req, res, next) => {
    try {
        if (req.user.id_role === 1) return next(); // Superadmin bebas

        const id_gizi = req.params.id;
        const query = `
            SELECT u.id_sppg 
            FROM gizi g 
            JOIN menu m ON g.id_menu = m.id_menu 
            JOIN users u ON m.created_by = u.id_user 
            WHERE g.id_gizi = $1
        `;
        const cek = await pool.query(query, [id_gizi]);

        if (cek.rows.length === 0) return res.status(404).json({ pesan: "Data gizi tidak ditemukan." });
        if (cek.rows[0].id_sppg !== req.user.id_sppg) return res.status(403).json({ pesan: "Akses ditolak. Bukan data Gizi dari SPPG Anda." });
        
        next();
    } catch (error) { 
        res.status(500).json({ pesan: "Error validasi otorisasi Gizi." }); 
    }
};

// 3. Satpam untuk mencegah injeksi Gizi ke Menu SPPG lain (Untuk Tambah)
const authorizeMenuParent = async (req, res, next) => {
    try {
        if (req.user.id_role === 1) return next();

        const { id_menu } = req.body;
        if (!id_menu) return res.status(400).json({ pesan: "ID Menu wajib disertakan." });

        const query = `SELECT u.id_sppg FROM menu m JOIN users u ON m.created_by = u.id_user WHERE m.id_menu = $1`;
        const cek = await pool.query(query, [id_menu]);

        if (cek.rows.length === 0) return res.status(404).json({ pesan: "Menu tidak ditemukan." });
        if (cek.rows[0].id_sppg !== req.user.id_sppg) return res.status(403).json({ pesan: "Akses ditolak. Anda tidak bisa menambah gizi ke Menu milik SPPG lain." });

        next();
    } catch (error) { 
        res.status(500).json({ pesan: "Error validasi Parent Menu." }); 
    }
};

module.exports = { authorizeSPPG, requireSuperadmin, forbidAkuntan, authorizeGizi, authorizeMenuParent, forbidGiziAndAkuntan, forbidAhliGizi };

