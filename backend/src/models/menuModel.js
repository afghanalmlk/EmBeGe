const pool = require('../config/db');

// --- TRANSACTIONS UNTUK MENU ---
const createMenuTx = async (client, nama_menu, id_user) => {
    const { rows } = await client.query('INSERT INTO menu (nama_menu, created_by) VALUES ($1, $2) RETURNING id_menu', [nama_menu, id_user]);
    return rows[0].id_menu;
};

const getBarangByNameTx = async (client, nama_barang) => {
    const { rows } = await client.query('SELECT id_barang FROM barang WHERE nama_barang ILIKE $1', [nama_barang]);
    return rows[0] || null;
};

const createBarangTx = async (client, nama_barang) => {
    const { rows } = await client.query('INSERT INTO barang (nama_barang) VALUES ($1) RETURNING id_barang', [nama_barang]);
    return rows[0].id_barang;
};

const createDetailMenuTx = async (client, id_menu, id_barang) => {
    await client.query('INSERT INTO detail_menu (id_menu, id_barang) VALUES ($1, $2)', [id_menu, id_barang]);
};

const createJadwalMenuTx = async (client, data) => {
    const query = `INSERT INTO jadwal_menu (id_menu, id_penerima, tanggal, qty_porsi_besar, qty_porsi_kecil, created_by) VALUES ($1, $2, $3, $4, $5, $6)`;
    const values = [data.id_menu, data.id_penerima, data.tanggal, data.qty_porsi_besar, data.qty_porsi_kecil, data.id_user];
    await client.query(query, values);
};

// --- QUERIES BIASA ---
const getAllMenu = async (roleId, sppgId) => {
    let queryStr = `
        SELECT m.id_menu, j.id_jadwal, m.nama_menu, j.tanggal, p.nama_penerima, j.qty_porsi_besar, j.qty_porsi_kecil
        FROM menu m
        JOIN users u ON m.created_by = u.id_user
        LEFT JOIN jadwal_menu j ON m.id_menu = j.id_menu
        LEFT JOIN penerima_manfaat p ON j.id_penerima = p.id_penerima
    `;
    let queryParams = [];

    if (roleId !== 1) {
        queryStr += ` WHERE u.id_sppg = $1`;
        queryParams.push(sppgId);
    }
    queryStr += ` ORDER BY j.tanggal DESC`;

    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
};

const updateMenuName = async (id_menu, nama_menu) => {
    await pool.query('UPDATE menu SET nama_menu=$1 WHERE id_menu=$2', [nama_menu, id_menu]);
};

const deleteMenu = async (id_menu) => {
    await pool.query('DELETE FROM menu WHERE id_menu = $1', [id_menu]);
};

module.exports = { 
    createMenuTx, 
    getBarangByNameTx, 
    createBarangTx, 
    createDetailMenuTx, 
    createJadwalMenuTx, 
    getAllMenu, 
    updateMenuName, 
    deleteMenu 
};