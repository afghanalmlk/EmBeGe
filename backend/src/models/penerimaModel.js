const pool = require('../config/db');

const getAllPenerima = async (roleId, sppgId) => {
    if (roleId === 1) {
        const { rows } = await pool.query('SELECT * FROM penerima_manfaat ORDER BY nama_penerima ASC');
        return rows;
    } else {
        const query = `
            SELECT p.* FROM penerima_manfaat p
            JOIN users u ON p.created_by = u.id_user
            WHERE u.id_sppg = $1
            ORDER BY p.nama_penerima ASC
        `;
        const { rows } = await pool.query(query, [sppgId]);
        return rows;
    }
};

const createPenerima = async (data) => {
    const query = 'INSERT INTO penerima_manfaat (nama_penerima, alamat, qty_porsi_besar, qty_porsi_kecil, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const values = [data.nama_penerima, data.alamat, data.qty_porsi_besar, data.qty_porsi_kecil, data.created_by];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const updatePenerima = async (id_penerima, data) => {
    const query = 'UPDATE penerima_manfaat SET nama_penerima=$1, alamat=$2, qty_porsi_besar=$3, qty_porsi_kecil=$4 WHERE id_penerima=$5 RETURNING *';
    const values = [data.nama_penerima, data.alamat, data.qty_porsi_besar, data.qty_porsi_kecil, id_penerima];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const deletePenerima = async (id_penerima) => {
    await pool.query('DELETE FROM penerima_manfaat WHERE id_penerima = $1', [id_penerima]);
};

module.exports = { 
    getAllPenerima, 
    createPenerima, 
    updatePenerima, 
    deletePenerima 
};