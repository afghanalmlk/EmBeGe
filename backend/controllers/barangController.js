const pool = require('../db');

const getAllBarang = async (req, res) => {
    try {
        // Mengambil semua barang dan mengurutkannya sesuai abjad (A-Z)
        const barangQuery = await pool.query(
            'SELECT * FROM barang ORDER BY nama_barang ASC'
        );

        res.status(200).json({
            pesan: "Berhasil mengambil daftar barang",
            data: barangQuery.rows
        });
    } catch (error) {
        console.error("Error saat mengambil daftar barang:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat mengambil data barang." });
    }
};

const tambahBarang = async (req, res) => {
    try {
        if (req.user.id_role !== 1) return res.status(403).json({ pesan: "Akses ditolak. Hanya Superadmin." });
        const { nama_barang } = req.body;
        const insert = await pool.query('INSERT INTO barang (nama_barang) VALUES ($1) RETURNING *', [nama_barang]);
        res.status(201).json({ pesan: "Barang ditambahkan", data: insert.rows[0] });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

const editBarang = async (req, res) => {
    try {
        if (req.user.id_role !== 1) return res.status(403).json({ pesan: "Akses ditolak." });
        const { nama_barang } = req.body;
        const update = await pool.query('UPDATE barang SET nama_barang = $1 WHERE id_barang = $2 RETURNING *', [nama_barang, req.params.id]);
        res.json({ pesan: "Barang diperbarui", data: update.rows[0] });
    } catch (error) { res.status(500).json({ pesan: "Error server" }); }
};

const hapusBarang = async (req, res) => {
    try {
        if (req.user.id_role !== 1) return res.status(403).json({ pesan: "Akses ditolak." });
        await pool.query('DELETE FROM barang WHERE id_barang = $1', [req.params.id]);
        res.json({ pesan: "Barang dihapus" });
    } catch (error) { res.status(500).json({ pesan: "Error server. Pastikan barang tidak sedang dipakai di tabel lain." }); }
};

module.exports = { getAllBarang, tambahBarang, editBarang, hapusBarang };