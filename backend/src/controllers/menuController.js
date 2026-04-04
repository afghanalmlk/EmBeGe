const pool = require('../config/db');
const menuModel = require('../models/menuModel');

const tambahMenuMaster = async (req, res) => {
    const client = await pool.connect();
    try {
        const { nama_menu, bahan_bahan } = req.body;
        await client.query('BEGIN');
        const id_menu = await menuModel.createMenuTx(client, nama_menu.trim(), req.user.id_user);
        for (const nama_barang of bahan_bahan) {
            let id_barang;
            const cekBarang = await menuModel.getBarangByNameTx(client, nama_barang.trim());
            id_barang = cekBarang ? cekBarang.id_barang : await menuModel.createBarangTx(client, nama_barang.trim());
            await menuModel.createDetailMenuTx(client, id_menu, id_barang);
        }
        await menuModel.createHistoriMenuTx(client, id_menu, "Resep Menu Dibuat (Menunggu Review)", req.user.id_user);
        await client.query('COMMIT');
        res.status(201).json({ pesan: "Menu berhasil diajukan!" });
    } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ pesan: "Gagal menyimpan menu." }); }
    finally { client.release(); }
};

const getMasterMenu = async (req, res) => {
    try {
        const data = await menuModel.getAllMasterMenu(req.user.id_role, req.user.id_sppg);
        const mappedData = data.map(m => ({
            ...m,
            is_mine: m.created_by === req.user.id_user 
        }));
        res.json({ data: mappedData });
    } catch (error) { res.status(500).json({ pesan: "Gagal mengambil master menu." }); }
};

const reviewAkuntan = async (req, res) => {
    const client = await pool.connect();
    try {
        const { is_approved_semua, catatan, bahan_checklist } = req.body;
        await client.query('BEGIN');
        for (const bahan of bahan_checklist) {
            await client.query('UPDATE detail_menu SET is_approved_akuntan = $1 WHERE id_detail_menu = $2', [bahan.is_approved, bahan.id_detail_menu]);
        }
        const statusBaru = is_approved_semua ? 'Disetujui Akuntan' : 'Perlu Revisi';
        await client.query('UPDATE menu SET status_menu = $1, catatan_akuntan = $2 WHERE id_menu = $3', [statusBaru, catatan, req.params.id]);
        await menuModel.createHistoriMenuTx(client, req.params.id, `Review Akuntan Selesai: ${statusBaru}`, req.user.id_user);
        await client.query('COMMIT');
        res.json({ pesan: "Hasil review berhasil disimpan." });
    } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ pesan: "Gagal memproses review." }); }
    finally { client.release(); }
};

// MENGGANTIKAN approveKasppg UNTUK MENDUKUNG "SETUJUI" DAN "TOLAK"
const updateStatusMenu = async (req, res) => {
    const client = await pool.connect();
    try {
        const { status_menu, catatan } = req.body;
        if (!status_menu) return res.status(400).json({ pesan: "Status wajib diisi." });

        await client.query('BEGIN');
        
        await client.query('UPDATE menu SET status_menu = $1, catatan_kasppg = $2 WHERE id_menu = $3', [status_menu, catatan, req.params.id]);
        
        let historiAksi = `Status Menu diubah menjadi: ${status_menu}`;
        if(status_menu === 'Ditolak' && catatan) {
            historiAksi += ` (Catatan: ${catatan})`;
        }
        await menuModel.createHistoriMenuTx(client, req.params.id, historiAksi, req.user.id_user);

        await client.query('COMMIT');
        res.json({ pesan: `Menu berhasil diubah menjadi ${status_menu}.` });
    } catch (error) { 
        await client.query('ROLLBACK'); 
        res.status(500).json({ pesan: "Gagal memproses status KaSPPG." }); 
    } finally { client.release(); }
};

const revisiMenuMaster = async (req, res) => {
    const client = await pool.connect();
    try {
        const { nama_menu, bahan_bahan } = req.body;
        await client.query('BEGIN');
        await menuModel.updateMenuHeaderTx(client, req.params.id, nama_menu.trim());
        await menuModel.deleteDetailMenuTx(client, req.params.id);
        for (const nama_barang of bahan_bahan) {
            let id_barang;
            const cekBarang = await menuModel.getBarangByNameTx(client, nama_barang.trim());
            id_barang = cekBarang ? cekBarang.id_barang : await menuModel.createBarangTx(client, nama_barang.trim());
            await menuModel.createDetailMenuTx(client, req.params.id, id_barang);
        }
        await menuModel.createHistoriMenuTx(client, req.params.id, "Menu Direvisi & Diajukan Ulang", req.user.id_user);
        await client.query('COMMIT');
        res.status(200).json({ pesan: "Revisi menu berhasil diajukan ulang!" });
    } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ pesan: "Gagal proses revisi." }); }
    finally { client.release(); }
};

const tambahJadwal = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id_menu, tanggal, list_penerima } = req.body;
        const id_user = req.user.id_user; 

        if (!id_menu || !tanggal || !list_penerima || list_penerima.length === 0) return res.status(400).json({ pesan: "Data tidak lengkap!" });

        await client.query('BEGIN');
        for (const penerima of list_penerima) {
            await menuModel.createJadwalMenuTx(client, {
                id_menu, id_penerima: penerima.id_penerima, tanggal, 
                qty_porsi_besar: penerima.porsi_besar, qty_porsi_kecil: penerima.porsi_kecil, id_user
            });
        }
        await client.query('COMMIT');
        res.status(201).json({ pesan: "Jadwal Menu Hari Ini berhasil didistribusikan!" });
    } catch (error) { await client.query('ROLLBACK'); res.status(500).json({ pesan: "Gagal menyimpan jadwal menu." }); } 
    finally { client.release(); }
};

const getJadwalMenu = async (req, res) => {
    try {
        const data = await menuModel.getAllJadwalMenu(req.user.id_role, req.user.id_sppg);
        res.json({ data });
    } catch (error) { res.status(500).json({ pesan: "Terjadi kesalahan pada server" }); }
};

// Router Placeholder untuk fitur hapus (yang Anda minta ditiadakan)
const hapusMenuMaster = async (req, res) => { res.json({ pesan: "Fitur dinonaktifkan." }); };
const hapusJadwal = async (req, res) => { res.json({ pesan: "Fitur dinonaktifkan." }); };

module.exports = { 
    tambahMenuMaster, getMasterMenu, hapusMenuMaster, reviewAkuntan, 
    updateStatusMenu, tambahJadwal, getJadwalMenu, hapusJadwal, revisiMenuMaster
};