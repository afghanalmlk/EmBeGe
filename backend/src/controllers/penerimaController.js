const penerimaModel = require('../models/penerimaModel');

const getAllPenerima = async (req, res) => {
    try {
        const data = await penerimaModel.getAllPenerima(req.user.id_role, req.user.id_sppg);
        res.status(200).json({ pesan: "Berhasil mengambil daftar penerima manfaat", data });
    } catch (error) {
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat mengambil data." });
    }
};

const tambahPenerima = async (req, res) => {
    try {
        const { nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil } = req.body;
        if (!nama_penerima || nama_penerima.trim() === '') return res.status(400).json({ pesan: "Nama penerima tidak boleh kosong!" });

        const data = await penerimaModel.createPenerima({
            nama_penerima: nama_penerima.trim(), alamat, qty_porsi_besar: qty_porsi_besar || 0, 
            qty_porsi_kecil: qty_porsi_kecil || 0, created_by: req.user.id_user
        });
        res.status(201).json({ pesan: "Data Penerima berhasil ditambahkan", data });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan server saat menyimpan data." }); 
    }
};

const editPenerima = async (req, res) => {
    try {
        const { nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil } = req.body;
        if (!nama_penerima || nama_penerima.trim() === '') return res.status(400).json({ pesan: "Nama penerima tidak boleh kosong!" });

        const data = await penerimaModel.updatePenerima(req.params.id, {
            nama_penerima: nama_penerima.trim(), alamat, qty_porsi_besar: qty_porsi_besar || 0, qty_porsi_kecil: qty_porsi_kecil || 0
        });
        res.json({ pesan: "Data penerima berhasil diperbarui", data });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan server saat memperbarui data." }); 
    }
};

const hapusPenerima = async (req, res) => {
    try {
        await penerimaModel.deletePenerima(req.params.id);
        res.json({ pesan: "Data penerima berhasil dihapus" });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan server saat menghapus data." }); 
    }
};
module.exports = { getAllPenerima, tambahPenerima, editPenerima, hapusPenerima };