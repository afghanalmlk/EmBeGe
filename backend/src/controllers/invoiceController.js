const pool = require('../config/db'); 
const invoiceModel = require('../models/invoiceModel');

const getInvoice = async (req, res) => {
    try {
        const data = await invoiceModel.getAllInvoice(req.user.id_role, req.user.id_sppg);
        
        // Membantu frontend mendeteksi pembuat Invoice
        const mappedData = data.map(inv => ({
            ...inv,
            is_mine: inv.created_by === req.user.id_user 
        }));

        res.status(200).json({ data: mappedData });
    } catch (error) {
        res.status(500).json({ pesan: "Gagal mengambil data invoice." });
    }
};

const tambahInvoice = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_po, tanggal_invoice, supplier, rincian_invoice } = req.body;
        if (!id_po || !rincian_invoice || rincian_invoice.length === 0) return res.status(400).json({ pesan: "Pilih minimal satu barang untuk di-invoice!" });

        await client.query('BEGIN');
        const id_invoice = await invoiceModel.createInvoiceTx(client, id_po, tanggal_invoice, supplier, req.user.id_user);

        for (const item of rincian_invoice) {
            await invoiceModel.createDetailInvoiceTx(client, id_invoice, item);
        }

        await invoiceModel.createHistoriInvoiceTx(client, id_invoice, 'Tagihan (Invoice) Dibuat (Pending)', req.user.id_user);

        await client.query('COMMIT');
        res.status(201).json({ pesan: "Invoice berhasil dicatat!", id_invoice });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Gagal menyimpan invoice." });
    } finally { client.release(); }
};

// --- FUNGSI REVISI INVOICE ---
const revisiInvoice = async (req, res) => {
    const client = await pool.connect();
    try {
        const id_invoice = req.params.id;
        const { id_po, tanggal_invoice, supplier, rincian_invoice } = req.body;
        const id_user = req.user.id_user;

        if (!id_po || !rincian_invoice || rincian_invoice.length === 0) return res.status(400).json({ pesan: "Data revisi tidak lengkap!" });

        const invSaatIni = await invoiceModel.getInvoiceStatus(id_invoice);
        if(!invSaatIni) return res.status(404).json({ pesan: "Invoice tidak ditemukan."});
        
        // Otorisasi: Hanya pembuat yang berhak merevisi
        if(invSaatIni.created_by !== id_user && req.user.id_role !== 1) {
            return res.status(403).json({ pesan: "Akses ditolak! Anda bukan pembuat Invoice ini." });
        }
        if(invSaatIni.status_invoice === 'Disetujui') {
            return res.status(400).json({ pesan: "Invoice yang sudah disetujui tidak dapat direvisi."});
        }

        await client.query('BEGIN');

        await invoiceModel.updateInvoiceHeaderTx(client, id_invoice, id_po, tanggal_invoice, supplier);
        await invoiceModel.deleteDetailInvoiceTx(client, id_invoice);

        for (const item of rincian_invoice) {
            await invoiceModel.createDetailInvoiceTx(client, id_invoice, item);
        }

        await invoiceModel.createHistoriInvoiceTx(client, id_invoice, 'Dokumen Invoice Direvisi', id_user);

        await client.query('COMMIT');
        res.status(200).json({ pesan: "Invoice berhasil direvisi dan diajukan ulang!" });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Gagal menyimpan revisi Invoice." });
    } finally { client.release(); }
};

const updateStatusInvoice = async (req, res) => {
    const client = await pool.connect();
    try {
        if (!req.body.status_invoice) return res.status(400).json({ pesan: "Status tidak boleh kosong." });
        
        await client.query('BEGIN');
        
        await invoiceModel.updateStatusInvoiceTx(client, req.params.id, req.body.status_invoice, req.body.catatan);
        
        let historiAksi = `Status Tagihan diubah menjadi: ${req.body.status_invoice}`;
        if(req.body.status_invoice === 'Ditolak' && req.body.catatan) {
            historiAksi += ` (Catatan: ${req.body.catatan})`;
        }

        await invoiceModel.createHistoriInvoiceTx(client, req.params.id, historiAksi, req.user.id_user);
        
        await client.query('COMMIT');
        res.status(200).json({ pesan: `Status Invoice berhasil diubah menjadi '${req.body.status_invoice}'` });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Terjadi kesalahan sistem saat memperbarui status invoice." });
    } finally { client.release(); }
};

module.exports = { getInvoice, tambahInvoice, revisiInvoice, updateStatusInvoice };