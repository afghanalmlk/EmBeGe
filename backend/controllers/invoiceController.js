const pool = require('../db');

const getInvoice = async (req, res) => {
    try {
        const sppg_id = req.user.id_sppg;
        const role_id = req.user.id_role;

        let queryStr = `
            SELECT 
                i.id_invoice, 
                i.tanggal_invoice, 
                i.supplier, 
                p.id_po, 
                u.username AS pembuat,
                SUM(di.harga_fix * di.qty) AS total_tagihan,
                json_agg(
                    json_build_object(
                        'id_barang', b.id_barang,
                        'nama_barang', b.nama_barang,
                        'qty', di.qty,
                        'satuan', di.satuan,
                        'harga_satuan', di.harga_fix,
                        'subtotal', (di.qty * di.harga_fix)
                    )
                ) AS rincian_tagihan
            FROM invoice i
            JOIN po p ON i.id_po = p.id_po
            JOIN users u ON i.created_by = u.id_user
            JOIN detail_invoice di ON i.id_invoice = di.id_invoice
            LEFT JOIN barang b ON di.id_barang = b.id_barang
        `;

        let invQuery;

        if (role_id === 1) {
            // Superadmin melihat semua invoice
            queryStr += ` GROUP BY i.id_invoice, p.id_po, u.username ORDER BY i.tanggal_invoice DESC`;
            invQuery = await pool.query(queryStr);
        } else {
            // Pegawai hanya melihat invoice dari SPPG-nya sendiri
            queryStr += ` WHERE u.id_sppg = $1 GROUP BY i.id_invoice, p.id_po, u.username ORDER BY i.tanggal_invoice DESC`;
            invQuery = await pool.query(queryStr, [sppg_id]);
        }

        res.status(200).json({
            pesan: "Berhasil mengambil daftar Invoice",
            data: invQuery.rows
        });
    } catch (error) {
        console.error("Error saat mengambil daftar Invoice:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat mengambil data Invoice." });
    }
};

const tambahInvoice = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id_po, tanggal_invoice, supplier, rincian_invoice } = req.body;
        // rincian_invoice berupa array: [{ id_barang, harga_fix, satuan, qty }]
        const id_user = req.user.id_user;

        // Validasi Dasar
        if (!id_po || !tanggal_invoice || !rincian_invoice || rincian_invoice.length === 0) {
            return res.status(400).json({ pesan: "Data Invoice belum lengkap!" });
        }

        await client.query('BEGIN');

        // Proteksi Tambahan: Pastikan PO tersebut milik SPPG yang sama
        if (req.user.id_role !== 1) {
            const cekPO = await client.query(
                `SELECT u.id_sppg FROM po p JOIN users u ON p.created_by = u.id_user WHERE p.id_po = $1`, 
                [id_po]
            );
            if (cekPO.rows.length === 0 || cekPO.rows[0].id_sppg !== req.user.id_sppg) {
                await client.query('ROLLBACK');
                return res.status(403).json({ pesan: "PO tidak valid atau bukan milik SPPG Anda." });
            }
        }

        // 1. Memasukkan ke tabel Invoice (Kepala Tagihan)
        const invQuery = await client.query(
            `INSERT INTO invoice (id_po, tanggal_invoice, supplier, created_by) 
             VALUES ($1, $2, $3, $4) RETURNING id_invoice`,
            [id_po, tanggal_invoice, supplier, id_user]
        );
        const id_invoice_baru = invQuery.rows[0].id_invoice;

        // 2. Memasukkan rincian barang riil ke detail_invoice (SEKARANG MENGGUNAKAN id_barang)
        for (const item of rincian_invoice) {
            await client.query(
                `INSERT INTO detail_invoice (id_invoice, id_barang, harga_fix, satuan, qty) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [id_invoice_baru, item.id_barang, item.harga_fix, item.satuan, item.qty]
            );
        }

        // 3. Catat di histori_po
        const detailPoQuery = await client.query('SELECT id_detail_po FROM detail_po WHERE id_po = $1 LIMIT 1', [id_po]);
        if (detailPoQuery.rows.length > 0) {
            await client.query(
                `INSERT INTO histori_po (id_detail_po, action, action_by) VALUES ($1, $2, $3)`,
                [detailPoQuery.rows[0].id_detail_po, `Invoice diterbitkan oleh Supplier: ${supplier}`, id_user]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            pesan: "Data Invoice berhasil dicatat ke dalam sistem!",
            id_invoice: id_invoice_baru
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error saat mencatat Invoice:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan sistem, transaksi Invoice dibatalkan." });
    } finally {
        client.release();
    }
};

const editInvoice = async (req, res) => {
    try {
        const { tanggal_invoice, supplier } = req.body; 
        
        // Biasanya mengedit invoice hanya merubah kepalanya (tanggal/supplier)
        await pool.query(
            'UPDATE invoice SET tanggal_invoice=$1, supplier=$2 WHERE id_invoice=$3', 
            [tanggal_invoice, supplier, req.params.id]
        );
        res.status(200).json({ pesan: "Invoice berhasil diperbarui" });
    } catch (error) { 
        console.error("Error edit Invoice:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); 
    }
};

const hapusInvoice = async (req, res) => {
    try {
        // Karena kita sudah menambahkan ON DELETE CASCADE di database, 
        // menghapus dari tabel invoice otomatis menghapus isinya dari detail_invoice
        await pool.query('DELETE FROM invoice WHERE id_invoice = $1', [req.params.id]);
        
        res.status(200).json({ pesan: "Invoice beserta rinciannya berhasil dihapus" });
    } catch (error) { 
        console.error("Error hapus Invoice:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); 
    }
};

module.exports = { getInvoice, tambahInvoice, editInvoice, hapusInvoice };