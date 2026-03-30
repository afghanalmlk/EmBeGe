const pool = require('../db');

const tambahMenu = async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            nama_menu, 
            bahan_bahan, // Array nama barang: ["Ayam", "Beras"]
            id_penerima, 
            tanggal, 
            qty_porsi_besar, 
            qty_porsi_kecil 
        } = req.body;
        
        const id_user = req.user.id_user; 

        // 1. Validasi Dasar
        if (!nama_menu || !tanggal || !bahan_bahan || bahan_bahan.length === 0) {
            return res.status(400).json({ pesan: "Nama Menu, Tanggal, dan minimal 1 Bahan Baku wajib diisi!" });
        }

        // 2. Memulai Transaksi
        await client.query('BEGIN');

        // 3. Memasukkan ke tabel Menu
        const menuQuery = await client.query(
            'INSERT INTO menu (nama_menu, created_by) VALUES ($1, $2) RETURNING id_menu',
            [nama_menu.trim(), id_user]
        );
        const id_menu_baru = menuQuery.rows[0].id_menu;

        // 4. Memproses Bahan Baku (Barang) ke tabel Detail Menu
        for (const nama_barang of bahan_bahan) {
            let id_barang_saat_ini;
            const barangBersih = nama_barang.trim(); // Hilangkan spasi lebih

            // Cek apakah barang sudah ada di master barang
            const cekBarang = await client.query(
                'SELECT id_barang FROM barang WHERE nama_barang ILIKE $1',
                [barangBersih]
            );

            if (cekBarang.rows.length > 0) {
                id_barang_saat_ini = cekBarang.rows[0].id_barang;
            } else {
                // Jika belum ada, buat Barang baru otomatis
                const barangBaru = await client.query(
                    'INSERT INTO barang (nama_barang) VALUES ($1) RETURNING id_barang',
                    [barangBersih]
                );
                id_barang_saat_ini = barangBaru.rows[0].id_barang;
            }

            // Menyambungkan Menu dan Barang
            await client.query(
                'INSERT INTO detail_menu (id_menu, id_barang) VALUES ($1, $2)',
                [id_menu_baru, id_barang_saat_ini]
            );
        }

        // 5. Memasukkan ke tabel Jadwal Menu
        await client.query(
            `INSERT INTO jadwal_menu 
            (id_menu, id_penerima, tanggal, qty_porsi_besar, qty_porsi_kecil, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [id_menu_baru, id_penerima, tanggal, qty_porsi_besar, qty_porsi_kecil, id_user]
        );

        // 6. Sahkan permanen!
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

const getMenu = async (req, res) => {
    try {
        const sppg_id = req.user.id_sppg;
        const role_id = req.user.id_role;

        let queryStr = `
            SELECT 
                m.id_menu, 
                j.id_jadwal,        -- <--- TAMBAHKAN BARIS INI (id_jadwal)
                m.nama_menu, 
                j.tanggal, 
                p.nama_penerima, 
                j.qty_porsi_besar, 
                j.qty_porsi_kecil
            FROM menu m
            JOIN users u ON m.created_by = u.id_user
            LEFT JOIN jadwal_menu j ON m.id_menu = j.id_menu
            LEFT JOIN penerima_manfaat p ON j.id_penerima = p.id_penerima
        `;
        let queryParams = [];

        // Jika bukan Superadmin, filter menu khusus dari dapurnya sendiri
        if (role_id !== 1) {
            queryStr += ` WHERE u.id_sppg = $1`;
            queryParams.push(sppg_id);
        }

        queryStr += ` ORDER BY j.tanggal DESC`;

        const menuQuery = await pool.query(queryStr, queryParams);

        res.json({
            pesan: role_id === 1 ? "Berhasil mengambil semua menu (Akses Superadmin)" : "Berhasil mengambil daftar menu SPPG Anda",
            data: menuQuery.rows
        });
    } catch (error) {
        console.error("Error saat mengambil daftar menu:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" });
    }
};

const editMenu = async (req, res) => {
    try {
        const { nama_menu } = req.body;
        
        if (!nama_menu) return res.status(400).json({ pesan: "Nama menu tidak boleh kosong!" });

        await pool.query('UPDATE menu SET nama_menu=$1 WHERE id_menu=$2', [nama_menu.trim(), req.params.id]);
        res.json({ pesan: "Nama menu diperbarui" });
    } catch (error) { 
        console.error("Error Edit Menu:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); 
    }
};

const hapusMenu = async (req, res) => {
    try {
        // Berkat ON DELETE CASCADE di database, ini akan menghapus detail_menu dan jadwal_menu juga.
        await pool.query('DELETE FROM menu WHERE id_menu = $1', [req.params.id]);
        res.json({ pesan: "Menu beserta jadwal dan detailnya berhasil dihapus" });
    } catch (error) { 
        console.error("Error Hapus Menu:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); 
    }
};

module.exports = { tambahMenu, getMenu, editMenu, hapusMenu };