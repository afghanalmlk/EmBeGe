const pool = require('../db');

const getAllPenerima = async (req, res) => {
    try {
        const sppg_id = req.user.id_sppg;
        const role_id = req.user.id_role;

        let penerimaQuery;

        if (role_id === 1) {
            // Superadmin melihat semua penerima manfaat
            penerimaQuery = await pool.query(
                'SELECT * FROM penerima_manfaat ORDER BY nama_penerima ASC'
            );
        } else {
            // Pegawai hanya melihat penerima manfaat yang didaftarkan oleh dapurnya
            penerimaQuery = await pool.query(
                `SELECT p.* FROM penerima_manfaat p
                 JOIN users u ON p.created_by = u.id_user
                 WHERE u.id_sppg = $1
                 ORDER BY p.nama_penerima ASC`,
                [sppg_id]
            );
        }

        res.status(200).json({
            pesan: "Berhasil mengambil daftar penerima manfaat",
            data: penerimaQuery.rows
        });
    } catch (error) {
        console.error("Error saat mengambil daftar penerima:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat mengambil data." });
    }
};

const tambahPenerima = async (req, res) => {
    try {
        const { nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil } = req.body;
        
        // Validasi input
        if (!nama_penerima || nama_penerima.trim() === '') {
            return res.status(400).json({ pesan: "Nama penerima tidak boleh kosong!" });
        }

        const insert = await pool.query(
            'INSERT INTO penerima_manfaat (nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nama_penerima.trim(), alamat, qty_porsi_besar || 0, qty_porsi_kecil || 0, req.user.id_user]
        );
        res.status(201).json({ pesan: "Data Penerima berhasil ditambahkan", data: insert.rows[0] });
    } catch (error) { 
        console.error("Error Tambah Penerima:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan server saat menyimpan data." }); 
    }
};

const editPenerima = async (req, res) => {
    try {
        const { nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil } = req.body;
        
        if (!nama_penerima || nama_penerima.trim() === '') {
            return res.status(400).json({ pesan: "Nama penerima tidak boleh kosong!" });
        }

        const update = await pool.query(
            'UPDATE penerima_manfaat SET nama_penerima=$1, alamat=$2, qty_porsi_besar=$3, qty_porsi_kecil=$4 WHERE id_penerima=$5 RETURNING *', 
            [nama_penerima.trim(), alamat, qty_porsi_besar || 0, qty_porsi_kecil || 0, req.params.id]
        );
        
        res.json({ pesan: "Data penerima berhasil diperbarui", data: update.rows[0] });
    } catch (error) { 
        console.error("Error Edit Penerima:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan server saat memperbarui data." }); 
    }
};

const hapusPenerima = async (req, res) => {
    try {
        await pool.query('DELETE FROM penerima_manfaat WHERE id_penerima = $1', [req.params.id]);
        res.json({ pesan: "Data penerima berhasil dihapus" });
    } catch (error) { 
        console.error("Error Hapus Penerima:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan server saat menghapus data." }); 
    }
};

module.exports = { getAllPenerima, tambahPenerima, editPenerima, hapusPenerima };