// src/models/authModel.js
const pool = require('../config/db');

// Mengecek id_sppg pembuat pada tabel secara dinamis
const getResourceSppgId = async (tableName, idColumnName, resourceId) => {
    // Penggunaan string literal aman di sini karena tableName & idColumnName di-hardcode dari Routes
    const query = `
        SELECT u.id_sppg 
        FROM ${tableName} t
        JOIN users u ON t.created_by = u.id_user
        WHERE t.${idColumnName} = $1
    `;
    const { rows } = await pool.query(query, [resourceId]);
    return rows[0] || null;
};

// Mengecek id_sppg pembuat data Gizi
const getGiziSppgId = async (id_gizi) => {
    const query = `
        SELECT u.id_sppg 
        FROM gizi g 
        JOIN menu m ON g.id_menu = m.id_menu 
        JOIN users u ON m.created_by = u.id_user 
        WHERE g.id_gizi = $1
    `;
    const { rows } = await pool.query(query, [id_gizi]);
    return rows[0] || null;
};

// Mengecek id_sppg pembuat Menu
const getMenuSppgId = async (id_menu) => {
    const query = `SELECT u.id_sppg FROM menu m JOIN users u ON m.created_by = u.id_user WHERE m.id_menu = $1`;
    const { rows } = await pool.query(query, [id_menu]);
    return rows[0] || null;
};

module.exports = { 
    getResourceSppgId, 
    getGiziSppgId, 
    getMenuSppgId 
};