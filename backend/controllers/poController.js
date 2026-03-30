const pool = require('../db');

const getPO = async (req, res) => {
    try {
        const sppg_id = req.user.id_sppg;
        const role_id = req.user.id_role;

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
            queryStr += ` GROUP BY p.id_po, m.nama_menu, u.username ORDER BY p.tanggal_po DESC`;
            poQuery = await pool.query(queryStr);
        } else {
            queryStr += ` WHERE u.id_sppg = $1 GROUP BY p.id_po, m.nama_menu, u.username ORDER BY p.tanggal_po DESC`;
            poQuery = await pool.query(queryStr, [sppg_id]);
        }

        res.status(200).json({
            pesan: "Berhasil mengambil daftar Purchase Order",
            data: poQuery.rows
        });
    } catch (error) {
        console.error("Error get PO:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat mengambil data PO." });
    }
};

const tambahPO = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_jadwal_menu, tanggal_po, daftar_barang } = req.body;
        const id_user = req.user.id_user; 

        if (!id_jadwal_menu || !tanggal_po || !daftar_barang || daftar_barang.length === 0) {
            return res.status(400).json({ pesan: "Jadwal Menu, Tanggal, dan Barang wajib diisi." });
        }

        await client.query('BEGIN');

        // VALIDASI: Pastikan Jadwal Menu milik SPPG yang sama (kecuali Superadmin)
        if (req.user.id_role !== 1) {
            const cekJadwal = await client.query(
                `SELECT u.id_sppg FROM jadwal_menu j 
                 JOIN menu m ON j.id_menu = m.id_menu 
                 JOIN users u ON m.created_by = u.id_user 
                 WHERE j.id_jadwal = $1`, 
                 [id_jadwal_menu]
            );
            if (cekJadwal.rows.length === 0 || cekJadwal.rows[0].id_sppg !== req.user.id_sppg) {
                await client.query('ROLLBACK');
                return res.status(403).json({ pesan: "Akses ditolak. Anda tidak bisa membuat PO dari jadwal menu SPPG lain." });
            }
        }

        const poQuery = await client.query(
            `INSERT INTO po (id_jadwal_menu, tanggal_po, created_by) VALUES ($1, $2, $3) RETURNING id_po`,
            [id_jadwal_menu, tanggal_po, id_user]
        );
        const id_po_baru = poQuery.rows[0].id_po;

        for (const item of daftar_barang) {
            const detailQuery = await client.query(
                `INSERT INTO detail_po (id_po, id_barang, qty_barang, harga_barang) VALUES ($1, $2, $3, $4) RETURNING id_detail_po`,
                [id_po_baru, item.id_barang, item.qty_barang, item.harga_barang]
            );
            
            await client.query(
                `INSERT INTO histori_po (id_detail_po, action, action_by) VALUES ($1, $2, $3)`,
                [detailQuery.rows[0].id_detail_po, 'PO Dibuat (Pending)', id_user]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ pesan: "Purchase Order berhasil dibuat!", id_po: id_po_baru });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error tambah PO:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan sistem, transaksi PO dibatalkan." });
    } finally {
        client.release();
    }
};

const updateStatusPO = async (req, res) => {
    const client = await pool.connect();
    try {
        const id_po = req.params.id; 
        const { status_po } = req.body; 
        const id_user = req.user.id_user; 

        if (!status_po) return res.status(400).json({ pesan: "Status PO wajib diisi." });

        await client.query('BEGIN');

        await client.query('UPDATE po SET status_po = $1 WHERE id_po = $2', [status_po, id_po]);

        const detailQuery = await client.query('SELECT id_detail_po FROM detail_po WHERE id_po = $1', [id_po]);

        for (const baris of detailQuery.rows) {
            await client.query(
                `INSERT INTO histori_po (id_detail_po, action, action_by) VALUES ($1, $2, $3)`,
                [baris.id_detail_po, `Status PO diubah menjadi: ${status_po}`, id_user]
            );
        }

        await client.query('COMMIT');
        res.status(200).json({ pesan: `Status PO berhasil diperbarui menjadi '${status_po}'!` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error update status PO:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan sistem saat memperbarui status." });
    } finally {
        client.release();
    }
};

const hapusPO = async (req, res) => {
    try {
        const id_po = req.params.id;
        
        // 1. Cek status PO
        const cekStatus = await pool.query(`SELECT status_po FROM po WHERE id_po = $1`, [id_po]);
        if (cekStatus.rows.length === 0) return res.status(404).json({ pesan: "PO tidak ditemukan" });
        if (cekStatus.rows[0].status_po.toLowerCase() !== 'pending') {
            return res.status(400).json({ pesan: "PO tidak bisa dihapus karena status sudah " + cekStatus.rows[0].status_po });
        }

        // 2. Eksekusi Hapus (Berkat ON DELETE CASCADE, detail_po & histori_po ikut terhapus otomatis!)
        await pool.query('DELETE FROM po WHERE id_po = $1', [id_po]);
        
        res.json({ pesan: "PO Pending beserta detailnya berhasil dibatalkan dan dihapus." });
    } catch (error) { 
        console.error("Error hapus PO:", error.message);
        res.status(500).json({ pesan: "Error server saat menghapus PO" }); 
    }
};

module.exports = { getPO, tambahPO, updateStatusPO , hapusPO};