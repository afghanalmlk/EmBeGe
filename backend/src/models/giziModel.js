const pool = require('../config/db');

const getAllGizi = async (roleId, sppgId) => {
    let queryStr = `
        SELECT g.*, m.nama_menu 
        FROM gizi g 
        JOIN menu m ON g.id_menu = m.id_menu 
        JOIN users u ON m.created_by = u.id_user
    `;
    let queryParams = [];

    if (roleId !== 1) {
        queryStr += ` WHERE u.id_sppg = $1`;
        queryParams.push(sppgId);
    }
    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
};

const checkDuplicateGizi = async (id_menu, jenis_porsi) => {
    const { rows } = await pool.query('SELECT id_gizi FROM gizi WHERE id_menu = $1 AND jenis_porsi ILIKE $2', [id_menu, jenis_porsi]);
    return rows;
};

const createGizi = async (data) => {
    const query = `INSERT INTO gizi (id_menu, jenis_porsi, energi, protein, lemak, karbo, serat) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const values = [data.id_menu, data.jenis_porsi, data.energi, data.protein, data.lemak, data.karbo, data.serat];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const updateGizi = async (id_gizi, data) => {
    const query = 'UPDATE gizi SET energi=$1, protein=$2, lemak=$3, karbo=$4, serat=$5 WHERE id_gizi=$6 RETURNING *';
    const values = [data.energi, data.protein, data.lemak, data.karbo, data.serat, id_gizi];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const deleteGizi = async (id_gizi) => {
    await pool.query('DELETE FROM gizi WHERE id_gizi = $1', [id_gizi]);
};

module.exports = { 
    getAllGizi, 
    checkDuplicateGizi, 
    createGizi, 
    updateGizi, 
    deleteGizi 
};