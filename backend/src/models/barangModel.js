const pool = require('../config/db');

const getAllBarang = async () => {
    const { rows } = await pool.query('SELECT * FROM barang ORDER BY nama_barang ASC');
    return rows;
};

const getBarangByName = async (nama_barang) => {
    const { rows } = await pool.query('SELECT id_barang FROM barang WHERE nama_barang ILIKE $1', [nama_barang]);
    return rows;
};

const getBarangByNameExcludeId = async (nama_barang, id_barang) => {
    const { rows } = await pool.query('SELECT id_barang FROM barang WHERE nama_barang ILIKE $1 AND id_barang != $2', [nama_barang, id_barang]);
    return rows;
};

const createBarang = async (nama_barang) => {
    const { rows } = await pool.query('INSERT INTO barang (nama_barang) VALUES ($1) RETURNING *', [nama_barang]);
    return rows[0];
};

const updateBarang = async (id_barang, nama_barang) => {
    const { rows } = await pool.query('UPDATE barang SET nama_barang = $1 WHERE id_barang = $2 RETURNING *', [nama_barang, id_barang]);
    return rows[0];
};

const deleteBarang = async (id_barang) => {
    const { rows } = await pool.query('DELETE FROM barang WHERE id_barang = $1 RETURNING *', [id_barang]);
    return rows[0];
};

module.exports = { 
    getAllBarang, 
    getBarangByName, 
    getBarangByNameExcludeId, 
    createBarang, 
    updateBarang, 
    deleteBarang 
};