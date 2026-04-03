const pool = require('../config/db'); // Diperlukan untuk inisiasi Transaction Client
const menuModel = require('../models/menuModel');

const tambahMenu = async (req, res) => {
    const client = await pool.connect();
    try {
        const { nama_menu, bahan_bahan, id_penerima, tanggal, qty_porsi_besar, qty_porsi_kecil } = req.body;
        const id_user = req.user.id_user; 

        if (!nama_menu || !tanggal || !bahan_bahan || bahan_bahan.length === 0) {
            return res.status(400).json({ pesan: "Nama Menu, Tanggal, dan minimal 1 Bahan Baku wajib diisi!" });
        }

        await client.query('BEGIN'); // Mulai Transaksi

        // 1. Insert Menu
        const id_menu = await menuModel.createMenuTx(client, nama_menu.trim(), id_user);

        // 2. Loop & Proses Bahan Baku (Barang + Detail Menu)
        for (const nama_barang of bahan_bahan) {
            const barangBersih = nama_barang.trim();
            let id_barang;

            const cekBarang = await menuModel.getBarangByNameTx(client, barangBersih);
            if (cekBarang) {
                id_barang = cekBarang.id_barang;
            } else {
                id_barang = await menuModel.createBarangTx(client, barangBersih);
            }
            await menuModel.createDetailMenuTx(client, id_menu, id_barang);
        }

        // 3. Insert Jadwal Menu
        await menuModel.createJadwalMenuTx(client, {
            id_menu, id_penerima, tanggal, qty_porsi_besar, qty_porsi_kecil, id_user
        });

        await client.query('COMMIT'); // Sahkan!

        res.status(201).json({ pesan: "Menu, Bahan Baku, dan Jadwal berhasil disimpan serentak!", id_menu });
    } catch (error) {
        await client.query('ROLLBACK'); // Batalkan jika ada error
        console.error("Error Form Menu:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan sistem, transaksi dibatalkan." });
    } finally {
        client.release();
    }
};

const getMenu = async (req, res) => {
    try {
        const data = await menuModel.getAllMenu(req.user.id_role, req.user.id_sppg);
        const pesan = req.user.id_role === 1 ? "Berhasil mengambil semua menu (Akses Superadmin)" : "Berhasil mengambil daftar menu SPPG Anda";
        res.json({ pesan, data });
    } catch (error) {
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" });
    }
};

const editMenu = async (req, res) => {
    try {
        if (!req.body.nama_menu) return res.status(400).json({ pesan: "Nama menu tidak boleh kosong!" });
        await menuModel.updateMenuName(req.params.id, req.body.nama_menu.trim());
        res.json({ pesan: "Nama menu diperbarui" });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); 
    }
};

const hapusMenu = async (req, res) => {
    try {
        await menuModel.deleteMenu(req.params.id);
        res.json({ pesan: "Menu beserta jadwal dan detailnya berhasil dihapus" });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); 
    }
};
module.exports = { tambahMenu, getMenu, editMenu, hapusMenu };