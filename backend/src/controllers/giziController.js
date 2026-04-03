const giziModel = require('../models/giziModel');

const getGizi = async (req, res) => {
    try {
        const data = await giziModel.getAllGizi(req.user.id_role, req.user.id_sppg);
        res.status(200).json({ pesan: "Berhasil mengambil data Gizi", data });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan server saat mengambil data." }); 
    }
};

const tambahGizi = async (req, res) => {
    try {
        const { id_menu, jenis_porsi, energi, protein, lemak, karbo, serat } = req.body;
        if (!id_menu || !jenis_porsi) return res.status(400).json({ pesan: "ID Menu dan Jenis Porsi wajib diisi!" });

        const cekDuplikat = await giziModel.checkDuplicateGizi(id_menu, jenis_porsi);
        if (cekDuplikat.length > 0) return res.status(400).json({ pesan: `Data gizi untuk porsi ${jenis_porsi} pada menu ini sudah ada!` });

        const data = await giziModel.createGizi({ id_menu, jenis_porsi, energi, protein, lemak, karbo, serat });
        res.status(201).json({ pesan: `Data gizi untuk porsi ${jenis_porsi} berhasil disimpan!`, data });
    } catch (error) {
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat menyimpan data gizi." });
    }
};

const editGizi = async (req, res) => {
    try {
        const data = await giziModel.updateGizi(req.params.id, req.body);
        res.status(200).json({ pesan: "Data gizi berhasil diperbarui", data });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan server saat memperbarui data." }); 
    }
};

const hapusGizi = async (req, res) => {
    try {
        await giziModel.deleteGizi(req.params.id);
        res.status(200).json({ pesan: "Data gizi berhasil dihapus" });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan server saat menghapus data." }); 
    }
};
module.exports = { tambahGizi, getGizi, editGizi, hapusGizi };