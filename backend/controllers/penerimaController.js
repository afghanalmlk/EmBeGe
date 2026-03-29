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
        const insert = await pool.query(
            'INSERT INTO penerima_manfaat (nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil, req.user.id_user]
        );
        res.status(201).json({ pesan: "Penerima ditambahkan", data: insert.rows[0] });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

const validasiAksesPenerima = async (id_penerima, reqUser) => {
    if (reqUser.id_role === 1) return true;
    const cek = await pool.query(`SELECT u.id_sppg FROM penerima_manfaat p JOIN users u ON p.created_by = u.id_user WHERE p.id_penerima = $1`, [id_penerima]);
    return cek.rows.length > 0 && cek.rows[0].id_sppg === reqUser.id_sppg;
};

const editPenerima = async (req, res) => {
    try {
        if (!(await validasiAksesPenerima(req.params.id, req.user))) return res.status(403).json({ pesan: "Akses ditolak." });
        const { nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil } = req.body;
        await pool.query('UPDATE penerima_manfaat SET nama_penerima=$1, alamat=$2, qty_porsi_besar=$3, qty_porsi_kecil=$4 WHERE id_penerima=$5', 
            [nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil, req.params.id]);
        res.json({ pesan: "Data penerima diperbarui" });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

const hapusPenerima = async (req, res) => {
    try {
        if (!(await validasiAksesPenerima(req.params.id, req.user))) return res.status(403).json({ pesan: "Akses ditolak." });
        await pool.query('DELETE FROM penerima_manfaat WHERE id_penerima = $1', [req.params.id]);
        res.json({ pesan: "Data penerima dihapus" });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

module.exports = { getAllPenerima, tambahPenerima, editPenerima, hapusPenerima };