const pool = require('../config/db'); 
const invoiceModel = require('../models/invoiceModel');

const getInvoice = async (req, res) => {
    try {
        const data = await invoiceModel.getAllInvoice(req.user.id_role, req.user.id_sppg);
        res.status(200).json({ data });
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

        await client.query('COMMIT');
        res.status(201).json({ pesan: "Invoice berhasil dibuat berdasarkan referensi PO!", id_invoice });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Gagal menyimpan invoice." });
    } finally {
        client.release();
    }
};

const editInvoice = async (req, res) => {
    try {
        await invoiceModel.updateInvoice(req.params.id, req.body);
        res.status(200).json({ pesan: "Invoice berhasil diperbarui" });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); 
    }
};

const hapusInvoice = async (req, res) => {
    try {
        await invoiceModel.deleteInvoice(req.params.id);
        res.status(200).json({ pesan: "Invoice beserta rinciannya berhasil dihapus" });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); 
    }
};

const updateStatusInvoice = async (req, res) => {
    try {
        if (!req.body.status_invoice) return res.status(400).json({ pesan: "Status tidak boleh kosong." });
        await invoiceModel.updateStatusInvoice(req.params.id, req.body.status_invoice);
        res.status(200).json({ pesan: `Status Invoice berhasil diubah menjadi '${req.body.status_invoice}'` });
    } catch (error) {
        res.status(500).json({ pesan: "Terjadi kesalahan sistem saat memperbarui status invoice." });
    }
};

module.exports = { getInvoice, tambahInvoice, editInvoice, hapusInvoice, updateStatusInvoice };