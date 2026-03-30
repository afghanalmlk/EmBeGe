const pool = require('../db');

const getAllBarang = async (req, res) => {
    try {
        const barangQuery = await pool.query('SELECT * FROM barang ORDER BY nama_barang ASC');
        res.status(200).json({
            pesan: "Berhasil mengambil daftar barang",
            data: barangQuery.rows
        });
    } catch (error) {
        console.error("Error get barang:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan server saat mengambil data barang." });
    }
};

const tambahBarang = async (req, res) => {
    try {
        const { nama_barang } = req.body;
        
        // 1. Validasi Input Kosong
        if (!nama_barang || nama_barang.trim() === '') {
            return res.status(400).json({ pesan: "Nama barang tidak boleh kosong!" });
        }

        // 2. Cek Duplikasi Barang (Mencegah beras dimasukkan 2 kali)
        const cek = await pool.query('SELECT id_barang FROM barang WHERE nama_barang ILIKE $1', [nama_barang.trim()]);
        if (cek.rows.length > 0) {
            return res.status(400).json({ pesan: "Barang sudah ada di database!" });
        }

        const insert = await pool.query(
            'INSERT INTO barang (nama_barang) VALUES ($1) RETURNING *', 
            [nama_barang.trim()] // Gunakan .trim() agar spasi di awal/akhir hilang
        );
        res.status(201).json({ pesan: "Barang berhasil ditambahkan", data: insert.rows[0] });
    } catch (error) { 
        console.error("Error tambah barang:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan server." }); 
    }
};

const editBarang = async (req, res) => {
    try {
        const { nama_barang } = req.body;
        const id_barang = req.params.id;

        if (!nama_barang || nama_barang.trim() === '') {
            return res.status(400).json({ pesan: "Nama barang tidak boleh kosong!" });
        }

        // Cek duplikasi sebelum edit (kecuali nama barangnya sendiri yang sedang diedit)
        const cek = await pool.query('SELECT id_barang FROM barang WHERE nama_barang ILIKE $1 AND id_barang != $2', [nama_barang.trim(), id_barang]);
        if (cek.rows.length > 0) {
            return res.status(400).json({ pesan: "Nama barang tersebut sudah dipakai!" });
        }

        const update = await pool.query(
            'UPDATE barang SET nama_barang = $1 WHERE id_barang = $2 RETURNING *', 
            [nama_barang.trim(), id_barang]
        );

        if (update.rows.length === 0) {
            return res.status(404).json({ pesan: "Barang tidak ditemukan." });
        }

        res.json({ pesan: "Barang diperbarui", data: update.rows[0] });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan server." }); 
    }
};

const hapusBarang = async (req, res) => {
    try {
        const deleteQuery = await pool.query('DELETE FROM barang WHERE id_barang = $1 RETURNING *', [req.params.id]);
        
        if (deleteQuery.rows.length === 0) {
            return res.status(404).json({ pesan: "Barang tidak ditemukan." });
        }

        res.json({ pesan: "Barang berhasil dihapus" });
    } catch (error) { 
        // Tangkap error jika barang masih dipakai di tabel lain (misal: detail_po, detail_menu)
        if (error.code === '23503') { // 23503 adalah kode error PostgreSQL untuk Foreign Key Violation
            return res.status(400).json({ pesan: "Gagal menghapus! Barang ini masih digunakan pada Menu, PO, atau Invoice." });
        }
        res.status(500).json({ pesan: "Terjadi kesalahan server." }); 
    }
};

module.exports = { getAllBarang, tambahBarang, editBarang, hapusBarang };