const pool = require('../config/db');
const poModel = require('../models/poModel');

const getPO = async (req, res) => {
    try {
        const data = await poModel.getAllPO(req.user.id_role, req.user.id_sppg);
        res.status(200).json({ pesan: "Berhasil mengambil daftar Purchase Order", data });
    } catch (error) {
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
                return res.status(403).json({ pesan: "Akses ditolak." });
            }
        }

        const id_po = await poModel.createPOTx(client, id_jadwal_menu, tanggal_po, id_user);

        for (const item of daftar_barang) {
            await poModel.createDetailPOTx(client, id_po, item.id_barang, item.qty_barang, item.harga_barang, item.satuan);
        }
        
        await poModel.createHistoriPOTx(client, id_po, 'PO Dibuat (Pending)', id_user);

        await client.query('COMMIT');
        res.status(201).json({ pesan: "Purchase Order berhasil dibuat!", id_po });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Terjadi kesalahan sistem, transaksi PO dibatalkan." });
    } finally { client.release(); }
};

const revisiPO = async (req, res) => {
    const client = await pool.connect();
    try {
        const id_po = req.params.id;
        const { id_jadwal_menu, tanggal_po, daftar_barang } = req.body;
        const id_user = req.user.id_user;

        if (!id_jadwal_menu || !tanggal_po || !daftar_barang || daftar_barang.length === 0) return res.status(400).json({ pesan: "Data revisi tidak lengkap!" });

        const poSaatIni = await poModel.getPOStatus(id_po);
        if(!poSaatIni) return res.status(404).json({ pesan: "PO tidak ditemukan."});
        
        if(poSaatIni.status_po === 'Disetujui') {
            return res.status(400).json({ pesan: "PO yang sudah disetujui tidak dapat direvisi."});
        }

        await client.query('BEGIN');

        await poModel.updatePOHeaderTx(client, id_po, id_jadwal_menu, tanggal_po);
        await poModel.deleteDetailPOTx(client, id_po);

        for (const item of daftar_barang) {
            await poModel.createDetailPOTx(client, id_po, item.id_barang, item.qty_barang, item.harga_barang, item.satuan);
        }
        
        await poModel.createHistoriPOTx(client, id_po, 'Dokumen PO Direvisi', id_user);

        await client.query('COMMIT');
        res.status(200).json({ pesan: "Purchase Order berhasil direvisi dan diajukan ulang!" });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Gagal menyimpan revisi PO." });
    } finally { client.release(); }
};

const updateStatusPO = async (req, res) => {
    const client = await pool.connect();
    try {
        const id_po = req.params.id; 
        const { status_po, catatan } = req.body; 

        if (!status_po) return res.status(400).json({ pesan: "Status PO wajib diisi." });

        await client.query('BEGIN');
        
        // Simpan status dan catatan (jika ada)
        await poModel.updateStatusPOTx(client, id_po, status_po, catatan);
        
        let historiAksi = `Status PO diubah menjadi: ${status_po}`;
        if(status_po === 'Ditolak' && catatan) {
            historiAksi += ` (Alasan: ${catatan})`;
        }
        
        await poModel.createHistoriPOTx(client, id_po, historiAksi, req.user.id_user);

        await client.query('COMMIT');
        res.status(200).json({ pesan: `Status PO berhasil diperbarui menjadi '${status_po}'!` });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Terjadi kesalahan sistem saat memperbarui status." });
    } finally { client.release(); }
};

module.exports = { getPO, tambahPO, revisiPO, updateStatusPO };