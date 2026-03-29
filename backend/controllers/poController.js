const pool = require('../db');

// UPDATE 1
const getPO = async (req, res) => {
    try {
        const sppg_id = req.user.id_sppg;
        const role_id = req.user.id_role;

        // Kita menyusun kerangka dasar SQL-nya
        let queryStr = `
            SELECT 
                p.id_po, 
                p.tanggal_po, 
                p.status_po, 
                m.nama_menu, 
                u.username AS pembuat,
                SUM(dp.qty_barang * dp.harga_barang) AS total_harga,
                json_agg(
                    json_build_object(
                        'nama_barang', b.nama_barang,
                        'qty', dp.qty_barang,
                        'harga_satuan', dp.harga_barang,
                        'subtotal', (dp.qty_barang * dp.harga_barang)
                    )
                ) AS rincian_barang
            FROM po p
            JOIN jadwal_menu j ON p.id_jadwal_menu = j.id_jadwal
            JOIN menu m ON j.id_menu = m.id_menu
            JOIN users u ON p.created_by = u.id_user
            JOIN detail_po dp ON p.id_po = dp.id_po
            JOIN barang b ON dp.id_barang = b.id_barang
        `;

        let poQuery;

        if (role_id === 1) {
            // Superadmin: Tanpa filter WHERE, langsung GROUP BY
            queryStr += ` GROUP BY p.id_po, m.nama_menu, u.username ORDER BY p.tanggal_po DESC`;
            poQuery = await pool.query(queryStr);
        } else {
            // Pegawai SPPG: Filter berdasarkan id_sppg pembuatnya
            queryStr += ` WHERE u.id_sppg = $1 GROUP BY p.id_po, m.nama_menu, u.username ORDER BY p.tanggal_po DESC`;
            poQuery = await pool.query(queryStr, [sppg_id]);
        }

        res.status(200).json({
            pesan: "Berhasil mengambil daftar Purchase Order",
            data: poQuery.rows
        });
    } catch (error) {
        console.error("Error saat mengambil daftar PO:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat mengambil data PO." });
    }
};

// DEFAULT
const tambahPO = async (req, res) => {
    const client = await pool.connect();

    try {
        // Menangkap data dari Form PO
        const { id_jadwal_menu, tanggal_po, daftar_barang } = req.body;
        // daftar_barang berupa array of objects: [{ id_barang, qty_barang, harga_barang }]
        
        const id_user = req.user.id_user; 

        await client.query('BEGIN');

        // 1. Memasukkan ke tabel PO (Kepala Surat)
        const poQuery = await client.query(
            `INSERT INTO po (id_jadwal_menu, tanggal_po, created_by) 
             VALUES ($1, $2, $3) RETURNING id_po`,
            [id_jadwal_menu, tanggal_po, id_user]
        );
        const id_po_baru = poQuery.rows[0].id_po;

        // 2. Memproses daftar belanjaan ke detail_po dan histori_po
        for (const item of daftar_barang) {
            // Masukkan ke detail_po
            const detailQuery = await client.query(
                `INSERT INTO detail_po (id_po, id_barang, qty_barang, harga_barang) 
                 VALUES ($1, $2, $3, $4) RETURNING id_detail_po`,
                [id_po_baru, item.id_barang, item.qty_barang, item.harga_barang]
            );
            
            const id_detail_po_baru = detailQuery.rows[0].id_detail_po;

            // 3. Masukkan jejak awal ke histori_po
            await client.query(
                `INSERT INTO histori_po (id_detail_po, action, action_by) 
                 VALUES ($1, $2, $3)`,
                [id_detail_po_baru, 'PO Dibuat (Pending)', id_user]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            pesan: "Purchase Order berhasil dibuat dan dicatat dalam histori!",
            id_po: id_po_baru
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error saat membuat PO:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan sistem, transaksi PO dibatalkan." });
    } finally {
        client.release();
    }
};

const updateStatusPO = async (req, res) => {
    const client = await pool.connect();

    try {
        const id_po = req.params.id; // Menangkap angka ID dari URL
        const { status_po } = req.body; // Menangkap status baru (misal: "Disetujui")
        const id_user = req.user.id_user; // Siapa yang menekan tombol ini

        await client.query('BEGIN');

        // 1. Ubah status di kepala surat (tabel po)
        await client.query(
            'UPDATE po SET status_po = $1 WHERE id_po = $2',
            [status_po, id_po]
        );

        // 2. Cari tahu ada barang apa saja di dalam PO ini
        const detailQuery = await client.query(
            'SELECT id_detail_po FROM detail_po WHERE id_po = $1',
            [id_po]
        );

        // 3. Catat ke dalam histori untuk SETIAP barang tersebut
        for (const baris of detailQuery.rows) {
            await client.query(
                `INSERT INTO histori_po (id_detail_po, action, action_by) 
                 VALUES ($1, $2, $3)`,
                [baris.id_detail_po, `Status PO diubah menjadi: ${status_po}`, id_user]
            );
        }

        await client.query('COMMIT');

        res.status(200).json({ 
            pesan: `Status PO berhasil diperbarui menjadi '${status_po}' dan histori telah dicatat!` 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error saat mengubah status PO:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan sistem saat memperbarui status." });
    } finally {
        client.release();
    }
};

const hapusPO = async (req, res) => {
    try {
        const id_po = req.params.id;
        
        // Cek ownership dan status
        const cek = await pool.query(`SELECT p.status_po, u.id_sppg FROM po p JOIN users u ON p.created_by = u.id_user WHERE p.id_po = $1`, [id_po]);
        if (cek.rows.length === 0) return res.status(404).json({ pesan: "PO tidak ditemukan" });
        
        const { status_po, id_sppg } = cek.rows[0];
        if (req.user.id_role !== 1 && id_sppg !== req.user.id_sppg) return res.status(403).json({ pesan: "Bukan PO dari SPPG Anda." });
        if (status_po.toLowerCase() !== 'pending') return res.status(400).json({ pesan: "PO tidak bisa dihapus karena status sudah " + status_po });

        // Hapus detail histori dulu, lalu detail PO, lalu PO (karena belum ON DELETE CASCADE di skema tabel PO)
        await pool.query('DELETE FROM histori_po WHERE id_detail_po IN (SELECT id_detail_po FROM detail_po WHERE id_po = $1)', [id_po]);
        await pool.query('DELETE FROM detail_po WHERE id_po = $1', [id_po]);
        await pool.query('DELETE FROM po WHERE id_po = $1', [id_po]);
        
        res.json({ pesan: "PO Pending berhasil dibatalkan dan dihapus" });
    } catch (error) { res.status(500).json({ pesan: "Error server saat menghapus PO" }); }
};

module.exports = { getPO, tambahPO, updateStatusPO , hapusPO};