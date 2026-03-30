const pool = require('../db');

const getGizi = async (req, res) => {
    try {
        let queryStr = `
            SELECT g.*, m.nama_menu 
            FROM gizi g 
            JOIN menu m ON g.id_menu = m.id_menu 
            JOIN users u ON m.created_by = u.id_user
        `;
        let queryParams = [];

        // Jika bukan Superadmin, filter berdasarkan SPPG user yang sedang login
        if (req.user.id_role !== 1) {
            queryStr += ` WHERE u.id_sppg = $1`;
            queryParams.push(req.user.id_sppg);
        }

        const gizi = await pool.query(queryStr, queryParams);
        res.status(200).json({ pesan: "Berhasil mengambil data Gizi", data: gizi.rows });
    } catch (error) { 
        console.error("Error get Gizi:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan server saat mengambil data." }); 
    }
};

const tambahGizi = async (req, res) => {
    try {
        const { id_menu, jenis_porsi, energi, protein, lemak, karbo, serat } = req.body;
        
        // 1. Validasi Input Dasar
        if (!id_menu || !jenis_porsi) {
            return res.status(400).json({ pesan: "ID Menu dan Jenis Porsi wajib diisi!" });
        }

        // 2. Cek Duplikasi: 1 Menu tidak boleh punya 2 data gizi dengan porsi yang sama
        const cekDuplikat = await pool.query(
            'SELECT id_gizi FROM gizi WHERE id_menu = $1 AND jenis_porsi ILIKE $2',
            [id_menu, jenis_porsi]
        );

        if (cekDuplikat.rows.length > 0) {
            return res.status(400).json({ pesan: `Data gizi untuk porsi ${jenis_porsi} pada menu ini sudah ada!` });
        }

        // 3. Insert ke database
        const giziQuery = await pool.query(
            `INSERT INTO gizi (id_menu, jenis_porsi, energi, protein, lemak, karbo, serat) 
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

const editGizi = async (req, res) => {
    try {
        // Hanya mengupdate nilai gizinya. 
        // id_menu dan jenis_porsi diabaikan agar struktur data tidak rusak/pindah menu.
        const { energi, protein, lemak, karbo, serat } = req.body;
        
        const updateQuery = await pool.query(
            'UPDATE gizi SET energi=$1, protein=$2, lemak=$3, karbo=$4, serat=$5 WHERE id_gizi=$6 RETURNING *', 
            [energi, protein, lemak, karbo, serat, req.params.id]
        );

        res.status(200).json({ 
            pesan: "Data gizi berhasil diperbarui",
            data: updateQuery.rows[0]
        });
    } catch (error) { 
        console.error("Error Edit Gizi:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan server saat memperbarui data." }); 
    }
};

const hapusGizi = async (req, res) => {
    try {
        await pool.query('DELETE FROM gizi WHERE id_gizi = $1', [req.params.id]);
        res.status(200).json({ pesan: "Data gizi berhasil dihapus" });
    } catch (error) { 
        console.error("Error Hapus Gizi:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan server saat menghapus data." }); 
    }
};

module.exports = { tambahGizi, getGizi, editGizi, hapusGizi };