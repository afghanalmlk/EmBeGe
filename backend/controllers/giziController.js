const pool = require('../db');

const tambahGizi = async (req, res) => {
    try {
        // Menangkap data dari Form Gizi
        const { id_menu, jenis_porsi, energi, protein, lemak, karbo, serat } = req.body;
        
        // Memasukkan data ke tabel gizi
        const giziQuery = await pool.query(
            `INSERT INTO gizi 
            (id_menu, jenis_porsi, energi, protein, lemak, karbo, serat) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [id_menu, jenis_porsi, energi, protein, lemak, karbo, serat]
        );

        res.status(201).json({
            pesan: `Data gizi untuk porsi ${jenis_porsi} berhasil disimpan!`,
            data: giziQuery.rows[0]
        });
    } catch (error) {
        console.error("Error saat menambah Form Gizi:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat menyimpan data gizi." });
    }
};

const getGizi = async (req, res) => {
    try {
        let queryStr = `SELECT g.*, m.nama_menu FROM gizi g JOIN menu m ON g.id_menu = m.id_menu JOIN users u ON m.created_by = u.id_user`;
        let queryParams = [];
        if (req.user.id_role !== 1) {
            queryStr += ` WHERE u.id_sppg = $1`;
            queryParams.push(req.user.id_sppg);
        }
        const gizi = await pool.query(queryStr, queryParams);
        res.json({ pesan: "Data Gizi", data: gizi.rows });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

const validasiAksesGizi = async (id_gizi, reqUser) => {
    if (reqUser.id_role === 1) return true;
    const cek = await pool.query(`SELECT u.id_sppg FROM gizi g JOIN menu m ON g.id_menu = m.id_menu JOIN users u ON m.created_by = u.id_user WHERE g.id_gizi = $1`, [id_gizi]);
    return cek.rows.length > 0 && cek.rows[0].id_sppg === reqUser.id_sppg;
};

const editGizi = async (req, res) => {
    try {
        const izinkan = await validasiAksesGizi(req.params.id, req.user);
        if (!izinkan) return res.status(403).json({ pesan: "Bukan data dari SPPG Anda." });
        
        const { energi, protein, lemak, karbo, serat } = req.body;
        await pool.query('UPDATE gizi SET energi=$1, protein=$2, lemak=$3, karbo=$4, serat=$5 WHERE id_gizi=$6', 
            [energi, protein, lemak, karbo, serat, req.params.id]);
        res.json({ pesan: "Data gizi diperbarui" });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

const hapusGizi = async (req, res) => {
    try {
        const izinkan = await validasiAksesGizi(req.params.id, req.user);
        if (!izinkan) return res.status(403).json({ pesan: "Bukan data dari SPPG Anda." });
        await pool.query('DELETE FROM gizi WHERE id_gizi = $1', [req.params.id]);
        res.json({ pesan: "Data gizi dihapus" });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

module.exports = { tambahGizi, getGizi, editGizi, hapusGizi };