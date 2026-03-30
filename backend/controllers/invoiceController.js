const pool = require('../db');

const getInvoice = async (req, res) => {
    try {
        const sppg_id = req.user.id_sppg;
        const role_id = req.user.id_role;

        let queryStr = `
            SELECT 
                i.id_invoice, i.tanggal_invoice, i.supplier, i.id_po, i.status_invoice,
                u.username AS pembuat,
                COALESCE(SUM(di.harga_fix * di.qty), 0) AS total_tagihan,
                json_agg(
                    json_build_object(
                        'nama_barang', b.nama_barang,
                        'qty', di.qty,
                        'satuan', di.satuan,
                        'harga_satuan', di.harga_fix,
                        'subtotal', (di.qty * di.harga_fix)
                    )
                ) FILTER (WHERE di.id_detail_invoice IS NOT NULL) AS rincian_tagihan
            FROM invoice i
            JOIN users u ON i.created_by = u.id_user
            LEFT JOIN detail_invoice di ON i.id_invoice = di.id_invoice
            LEFT JOIN barang b ON di.id_barang = b.id_barang -- Sekarang JOIN aman karena kolom id_barang sudah ada
        `;

        let queryParams = [];
        if (role_id !== 1) {
            queryStr += ` WHERE u.id_sppg = $1`;
            queryParams.push(sppg_id);
        }

        queryStr += ` GROUP BY i.id_invoice, u.username ORDER BY i.tanggal_invoice DESC`;

        const invQuery = await pool.query(queryStr, queryParams);
        res.status(200).json({ data: invQuery.rows });
    } catch (error) {
        console.error("Backend Error Invoice:", error.message);
        res.status(500).json({ pesan: "Gagal mengambil data invoice." });
    }
};

const tambahInvoice = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_po, tanggal_invoice, supplier, rincian_invoice } = req.body;
        const id_user = req.user.id_user;

        if (!id_po || !rincian_invoice || rincian_invoice.length === 0) {
            return res.status(400).json({ pesan: "Pilih minimal satu barang untuk di-invoice!" });
        }

        await client.query('BEGIN');

        // 1. Simpan Kepala Invoice
        const invQuery = await client.query(
            `INSERT INTO invoice (id_po, tanggal_invoice, supplier, created_by, status_invoice) 
             VALUES ($1, $2, $3, $4, 'Pending') RETURNING id_invoice`,
            [id_po, tanggal_invoice, supplier, id_user]
        );
        const id_invoice_baru = invQuery.rows[0].id_invoice;

        // 2. Simpan Detail Invoice (Hanya barang yang dicentang)
        for (const item of rincian_invoice) {
            // item berisi: { id_barang, harga_fix, qty, satuan }
            await client.query(
                `INSERT INTO detail_invoice (id_invoice, id_barang, harga_fix, qty, satuan) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [id_invoice_baru, item.id_barang, item.harga_fix, item.qty, item.satuan]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ pesan: "Invoice berhasil dibuat berdasarkan referensi PO!", id_invoice: id_invoice_baru });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error Simpan Invoice:", error.message);
        res.status(500).json({ pesan: "Gagal menyimpan invoice." });
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

const updateStatusInvoice = async (req, res) => {
    try {
        const { status_invoice } = req.body;
        if (!status_invoice) return res.status(400).json({ pesan: "Status tidak boleh kosong." });
        
        await pool.query('UPDATE invoice SET status_invoice = $1 WHERE id_invoice = $2', [status_invoice, req.params.id]);
        res.status(200).json({ pesan: `Status Invoice berhasil diubah menjadi '${status_invoice}'` });
    } catch (error) {
        res.status(500).json({ pesan: "Terjadi kesalahan sistem saat memperbarui status invoice." });
    }
};

// Jangan lupa update exports-nya:
module.exports = { getInvoice, tambahInvoice, editInvoice, hapusInvoice, updateStatusInvoice };