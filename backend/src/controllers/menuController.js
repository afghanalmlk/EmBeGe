const pool = require('../config/db');
const menuModel = require('../models/menuModel');

// ================= MASTER MENU =================
const tambahMenuMaster = async (req, res) => {
    const client = await pool.connect();
    try {
        const { nama_menu, bahan_bahan } = req.body;
        const id_user = req.user.id_user; 

        if (!nama_menu || !bahan_bahan || bahan_bahan.length === 0) {
            return res.status(400).json({ pesan: "Nama Menu dan minimal 1 Bahan Baku wajib diisi!" });
        }

        await client.query('BEGIN');
        const id_menu = await menuModel.createMenuTx(client, nama_menu.trim(), id_user);

        for (const nama_barang of bahan_bahan) {
            const barangBersih = nama_barang.trim();
            let id_barang;

            const cekBarang = await menuModel.getBarangByNameTx(client, barangBersih);
            if (cekBarang) { id_barang = cekBarang.id_barang; } 
            else { id_barang = await menuModel.createBarangTx(client, barangBersih); }
            
            await menuModel.createDetailMenuTx(client, id_menu, id_barang);
        }

        await client.query('COMMIT');
        res.status(201).json({ pesan: "Menu berhasil dibuat dan menunggu review Akuntan!", id_menu });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Terjadi kesalahan sistem, transaksi dibatalkan." });
    } finally { client.release(); }
};

const getMasterMenu = async (req, res) => {
    try {
        const data = await menuModel.getAllMasterMenu(req.user.id_role, req.user.id_sppg);
        res.json({ data });
    } catch (error) { res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); }
};

const hapusMenuMaster = async (req, res) => {
    try {
        await menuModel.deleteMenu(req.params.id);
        res.json({ pesan: "Menu master beserta resepnya berhasil dihapus" });
    } catch (error) { res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); }
};

// ================= APPROVAL LOGIC =================
const reviewAkuntan = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { is_approved_semua, catatan, bahan_checklist } = req.body;
        
        await client.query('BEGIN');

        // Update status checklist tiap bahan
        if (bahan_checklist && bahan_checklist.length > 0) {
            for (const bahan of bahan_checklist) {
                await client.query('UPDATE detail_menu SET is_approved_akuntan = $1 WHERE id_detail_menu = $2', [bahan.is_approved, bahan.id_detail_menu]);
            }
        }

        const statusBaru = is_approved_semua ? 'Disetujui Akuntan' : 'Revisi';
        await client.query('UPDATE menu SET status_menu = $1, catatan_akuntan = $2 WHERE id_menu = $3', [statusBaru, catatan, id]);

        await client.query('COMMIT');
        res.json({ pesan: `Review selesai. Status menu: ${statusBaru}` });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Gagal menyimpan hasil review Akuntan." });
    } finally { client.release(); }
};

const approveKasppg = async (req, res) => {
    try {
        await pool.query('UPDATE menu SET status_menu = $1 WHERE id_menu = $2', ['Disetujui', req.params.id]);
        res.json({ pesan: "Menu berhasil disetujui (Final)." });
    } catch (error) { res.status(500).json({ pesan: "Gagal melakukan approval KaSPPG." }); }
};


// ================= JADWAL MENU (HARI INI) =================
const tambahJadwal = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_menu, tanggal, list_penerima } = req.body;
        const id_user = req.user.id_user; 

        if (!id_menu || !tanggal || !list_penerima || list_penerima.length === 0) {
            return res.status(400).json({ pesan: "Pilih Menu Final, Tanggal, dan minimal 1 Penerima Manfaat!" });
        }

        await client.query('BEGIN');
        
        for (const penerima of list_penerima) {
            await menuModel.createJadwalMenuTx(client, {
                id_menu, id_penerima: penerima.id_penerima, tanggal, 
                qty_porsi_besar: penerima.porsi_besar, qty_porsi_kecil: penerima.porsi_kecil, id_user
            });
        }

        await client.query('COMMIT');
        res.status(201).json({ pesan: "Jadwal Menu Hari Ini berhasil didistribusikan!" });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ pesan: "Gagal menyimpan jadwal menu." });
    } finally { client.release(); }
};

const getJadwalMenu = async (req, res) => {
    try {
        const data = await menuModel.getAllJadwalMenu(req.user.id_role, req.user.id_sppg);
        res.json({ data });
    } catch (error) { res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); }
};

const hapusJadwal = async (req, res) => {
    try {
        await menuModel.deleteJadwal(req.params.id);
        res.json({ pesan: "Jadwal distribusi berhasil dihapus" });
    } catch (error) { res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); }
};

module.exports = { 
    tambahMenuMaster, getMasterMenu, hapusMenuMaster, 
    reviewAkuntan, approveKasppg, 
    tambahJadwal, getJadwalMenu, hapusJadwal 
};