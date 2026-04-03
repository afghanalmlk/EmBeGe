const barangModel = require('../models/barangModel');

const getAllBarang = async (req, res) => {
    try {
        const barang = await barangModel.getAllBarang();
        res.status(200).json({ pesan: "Berhasil mengambil daftar barang", data: barang });
    } catch (error) {
        res.status(500).json({ pesan: "Terjadi kesalahan server saat mengambil data barang." });
    }
};

const tambahBarang = async (req, res) => {
    try {
        const { nama_barang } = req.body;
        if (!nama_barang || nama_barang.trim() === '') return res.status(400).json({ pesan: "Nama barang tidak boleh kosong!" });

        const cek = await barangModel.getBarangByName(nama_barang.trim());
        if (cek.length > 0) return res.status(400).json({ pesan: "Barang sudah ada di database!" });

        const data = await barangModel.createBarang(nama_barang.trim());
        res.status(201).json({ pesan: "Barang berhasil ditambahkan", data });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan server." }); 
    }
};

const editBarang = async (req, res) => {
    try {
        const { nama_barang } = req.body;
        const id_barang = req.params.id;

        if (!nama_barang || nama_barang.trim() === '') return res.status(400).json({ pesan: "Nama barang tidak boleh kosong!" });

        const cek = await barangModel.getBarangByNameExcludeId(nama_barang.trim(), id_barang);
        if (cek.length > 0) return res.status(400).json({ pesan: "Nama barang tersebut sudah dipakai!" });

        const updated = await barangModel.updateBarang(id_barang, nama_barang.trim());
        if (!updated) return res.status(404).json({ pesan: "Barang tidak ditemukan." });

        res.json({ pesan: "Barang diperbarui", data: updated });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan server." }); 
    }
};

const hapusBarang = async (req, res) => {
    try {
        const deleted = await barangModel.deleteBarang(req.params.id);
        if (!deleted) return res.status(404).json({ pesan: "Barang tidak ditemukan." });
        res.json({ pesan: "Barang berhasil dihapus" });
    } catch (error) { 
        if (error.code === '23503') return res.status(400).json({ pesan: "Gagal menghapus! Barang ini masih digunakan pada Menu, PO, atau Invoice." });
        res.status(500).json({ pesan: "Terjadi kesalahan server." }); 
    }
};
module.exports = { getAllBarang, tambahBarang, editBarang, hapusBarang };