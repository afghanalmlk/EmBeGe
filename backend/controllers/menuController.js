const pool = require('../db');

const tambahMenu = async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            nama_menu, 
            bahan_bahan, // Kembali menjadi array nama barang yang simpel: ["Ayam", "Beras"]
            id_penerima, 
            tanggal, 
            qty_porsi_besar, 
            qty_porsi_kecil 
        } = req.body;
        
        const id_user = req.user.id_user; 

        // 1. Memulai Transaksi
        await client.query('BEGIN');

        // 2. Memasukkan ke tabel Menu
        const menuQuery = await client.query(
            'INSERT INTO menu (nama_menu, created_by) VALUES ($1, $2) RETURNING id_menu',
            [nama_menu, id_user]
        );
        const id_menu_baru = menuQuery.rows[0].id_menu;

        // 3. Memproses Bahan Baku (Barang) ke tabel Detail Menu
        for (const nama_barang of bahan_bahan) {
            let id_barang_saat_ini;

            // Cek apakah barang sudah ada
            const cekBarang = await client.query(
                'SELECT id_barang FROM barang WHERE nama_barang ILIKE $1',
                [nama_barang]
            );

            if (cekBarang.rows.length > 0) {
                id_barang_saat_ini = cekBarang.rows[0].id_barang;
            } else {
                // Jika belum ada, buat Barang baru otomatis
                const barangBaru = await client.query(
                    'INSERT INTO barang (nama_barang) VALUES ($1) RETURNING id_barang',
                    [nama_barang]
                );
                id_barang_saat_ini = barangBaru.rows[0].id_barang;
            }

            // Menyambungkan Menu dan Barang (Tanpa Takaran)
            await client.query(
                'INSERT INTO detail_menu (id_menu, id_barang) VALUES ($1, $2)',
                [id_menu_baru, id_barang_saat_ini]
            );
        }

        // 4. Memasukkan ke tabel Jadwal Menu
        await client.query(
            `INSERT INTO jadwal_menu 
            (id_menu, id_penerima, tanggal, qty_porsi_besar, qty_porsi_kecil, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [id_menu_baru, id_penerima, tanggal, qty_porsi_besar, qty_porsi_kecil, id_user]
        );

        // 5. Sahkan permanen!
        await client.query('COMMIT');

        res.status(201).json({
            pesan: "Menu, Bahan Baku, dan Jadwal berhasil disimpan serentak!",
            id_menu: id_menu_baru
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error saat menyimpan Form Menu:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan sistem, transaksi dibatalkan." });
    } finally {
        client.release();
    }
};

// UPDATE 1
// --- KODE BARU: Fungsi untuk mengambil daftar menu ---
const getMenu = async (req, res) => {
    try {
        const sppg_id = req.user.id_sppg;
        const role_id = req.user.id_role; // Kita tangkap ID Role dari Token

        let menuQuery;

        if (role_id === 1) {
            // Jika Superadmin, tampilkan SEMUA menu dari semua dapur
            menuQuery = await pool.query(
                `SELECT 
                    m.id_menu, 
                    m.nama_menu, 
                    j.tanggal, 
                    p.nama_penerima, 
                    j.qty_porsi_besar, 
                    j.qty_porsi_kecil
                 FROM menu m
                 JOIN users u ON m.created_by = u.id_user
                 LEFT JOIN jadwal_menu j ON m.id_menu = j.id_menu
                 LEFT JOIN penerima_manfaat p ON j.id_penerima = p.id_penerima
                 ORDER BY j.tanggal DESC`
            );
        } else {
            // Jika KaSPPG/Ahli Gizi, tampilkan HANYA menu dari dapurnya sendiri
            menuQuery = await pool.query(
                `SELECT 
                    m.id_menu, 
                    m.nama_menu, 
                    j.tanggal, 
                    p.nama_penerima, 
                    j.qty_porsi_besar, 
                    j.qty_porsi_kecil
                 FROM menu m
                 JOIN users u ON m.created_by = u.id_user
                 LEFT JOIN jadwal_menu j ON m.id_menu = j.id_menu
                 LEFT JOIN penerima_manfaat p ON j.id_penerima = p.id_penerima
                 WHERE u.id_sppg = $1
                 ORDER BY j.tanggal DESC`,
                [sppg_id]
            );
        }

        res.json({
            pesan: role_id === 1 ? "Berhasil mengambil semua menu (Akses Superadmin)" : "Berhasil mengambil daftar menu SPPG Anda",
            data: menuQuery.rows
        });
    } catch (error) {
        console.error("Error saat mengambil daftar menu:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" });
    }
};

const validasiAksesMenu = async (id_menu, reqUser) => {
    if (reqUser.id_role === 1) return true;
    const cek = await pool.query(`SELECT u.id_sppg FROM menu m JOIN users u ON m.created_by = u.id_user WHERE m.id_menu = $1`, [id_menu]);
    return cek.rows.length > 0 && cek.rows[0].id_sppg === reqUser.id_sppg;
};

const editMenu = async (req, res) => {
    try {
        const izinkan = await validasiAksesMenu(req.params.id, req.user);
        if (!izinkan) return res.status(403).json({ pesan: "Akses ditolak." });
        await pool.query('UPDATE menu SET nama_menu=$1 WHERE id_menu=$2', [req.body.nama_menu, req.params.id]);
        res.json({ pesan: "Nama menu diperbarui" });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

const hapusMenu = async (req, res) => {
    try {
        const izinkan = await validasiAksesMenu(req.params.id, req.user);
        if (!izinkan) return res.status(403).json({ pesan: "Akses ditolak." });
        // Detail Menu dan Jadwal akan terhapus otomatis karena ON DELETE CASCADE di database
        await pool.query('DELETE FROM menu WHERE id_menu = $1', [req.params.id]);
        res.json({ pesan: "Menu terhapus seluruhnya" });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

module.exports = { tambahMenu, getMenu, editMenu, hapusMenu };