const pool = require('../db');

const getSppg = async (req, res) => {
    try {
        const result = await pool.query('SELECT id_sppg, nama_sppg, alamat FROM sppg ORDER BY nama_sppg ASC');
        res.json(result.rows);
    } catch (error) {
        console.error("Error get SPPG:", error);
        res.status(500).json({ pesan: "Error server" });
    }
};

module.exports = { getSppg };