const pool = require('../config/db'); // Untuk Transaction Client
const poModel = require('../models/poModel');

const getPO = async (req, res) => {
    try {
        const data = await poModel.getAllPO(req.user.id_role, req.user.id_sppg);
        res.status(200).json({ pesan: "Berhasil mengambil daftar Purchase Order", data });
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

        if (req.user.id_role !== 1) {
            const jadwal = await poModel.checkJadwalMenuSppgTx(client, id_jadwal_menu);
            if (!jadwal || jadwal.id_sppg !== req.user.id_sppg) {
                await client.query('ROLLBACK');
                return res.status(403).json({ pesan: "Akses ditolak. Anda tidak bisa membuat PO dari jadwal menu SPPG lain." });
            }
        }

        const id_po = await poModel.createPOTx(client, id_jadwal_menu, tanggal_po, id_user);

        for (const item of daftar_barang) {
            const id_detail_po = await poModel.createDetailPOTx(client, id_po, item.id_barang, item.qty_barang, item.harga_barang, item.satuan);
            await poModel.createHistoriPOTx(client, id_detail_po, 'PO Dibuat (Pending)', id_user);
        }

        await client.query('COMMIT');
        res.status(201).json({ pesan: "Purchase Order berhasil dibuat!", id_po });
    } catch (error) {
        await client.query('ROLLBACK');
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

        if (!status_po) return res.status(400).json({ pesan: "Status PO wajib diisi." });

        await client.query('BEGIN');
        await poModel.updateStatusPOTx(client, id_po, status_po);

        const details = await poModel.getDetailPOIdsTx(client, id_po);
        for (const baris of details) {
            await poModel.createHistoriPOTx(client, baris.id_detail_po, `Status PO diubah menjadi: ${status_po}`, req.user.id_user);
        }

        await client.query('COMMIT');
        res.status(200).json({ pesan: `Status PO berhasil diperbarui menjadi '${status_po}'!` });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Terjadi kesalahan sistem saat memperbarui status." });
    } finally {
        client.release();
    }
};

const hapusPO = async (req, res) => {
    try {
        const po = await poModel.getPOStatus(req.params.id);
        if (!po) return res.status(404).json({ pesan: "PO tidak ditemukan" });
        if (po.status_po.toLowerCase() !== 'pending') return res.status(400).json({ pesan: "PO tidak bisa dihapus karena status sudah " + po.status_po });

        await poModel.deletePO(req.params.id);
        res.json({ pesan: "PO Pending beserta detailnya berhasil dibatalkan dan dihapus." });
    } catch (error) { 
        res.status(500).json({ pesan: "Error server saat menghapus PO" }); 
    }
};

module.exports = { getPO, tambahPO, updateStatusPO, hapusPO };