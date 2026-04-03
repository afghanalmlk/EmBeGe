// src/models/userModel.js
// Bertanggung jawab penuh untuk segala query terkait Users
const pool = require('../config/db');

// --- AUTH QUERIES ---
const checkDuplicateUser = async (username, email) => {
    const query = 'SELECT username, email FROM users WHERE username = $1 OR email = $2';
    const { rows } = await pool.query(query, [username, email]);
    return rows;
};

const getUserByUsernameWithSppg = async (username) => {
    const query = `
        SELECT u.*, s.nama_sppg, s.alamat 
        FROM users u 
        LEFT JOIN sppg s ON u.id_sppg = s.id_sppg 
        WHERE u.username = $1
    `;
    const { rows } = await pool.query(query, [username]);
    return rows[0] || null;
};

const createUserTx = async (client, data) => {
    const query = `
        INSERT INTO users (id_role, id_sppg, username, password, email, no_telp) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id_user, username
    `;
    const values = [data.id_role, data.id_sppg, data.username, data.hashedPassword, data.email, data.no_telp];
    const { rows } = await client.query(query, values);
    return rows[0];
};

// --- USER MANAGEMENT QUERIES ---
const getAllUsers = async (roleId, sppgId) => {
    let queryStr = `
        SELECT u.id_user, u.username, u.no_telp AS kontak, u.id_role, 
               r.nama_role, u.id_sppg, s.nama_sppg, s.alamat
        FROM users u
        JOIN role r ON u.id_role = r.id_role
        LEFT JOIN sppg s ON u.id_sppg = s.id_sppg
    `;
    let queryParams = [];

    // Filter berdasarkan role (Bukan superadmin -> Hanya SPPG-nya sendiri)
    if (roleId !== 1) {
        queryStr += ` WHERE u.id_sppg = $1`;
        queryParams.push(sppgId);
    }

    queryStr += ` ORDER BY u.id_role ASC, u.username ASC`;
    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
};

const checkRoleInSppg = async (sppgId, roleId) => {
    const query = 'SELECT id_user FROM users WHERE id_sppg = $1 AND id_role = $2';
    const { rows } = await pool.query(query, [sppgId, roleId]);
    return rows;
};

const createUser = async (data) => {
    const query = `
        INSERT INTO users (id_role, id_sppg, username, password, email, no_telp) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id_user, username, email
    `;
    const values = [data.id_role, data.id_sppg, data.username, data.password, data.email, data.no_telp];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const checkDuplicateExcludeId = async (username, email, id_user) => {
    const query = 'SELECT id_user FROM users WHERE (username = $1 OR email = $2) AND id_user != $3';
    const { rows } = await pool.query(query, [username, email, id_user]);
    return rows;
};

const updateUser = async (id_user, data) => {
    let query;
    let values;
    if (data.password) {
        query = 'UPDATE users SET username=$1, email=$2, no_telp=$3, password=$4 WHERE id_user=$5';
        values = [data.username, data.email, data.no_telp, data.password, id_user];
    } else {
        query = 'UPDATE users SET username=$1, email=$2, no_telp=$3 WHERE id_user=$4';
        values = [data.username, data.email, data.no_telp, id_user];
    }
    await pool.query(query, values);
};

const getUserById = async (id_user) => {
    const query = 'SELECT id_role, id_sppg FROM users WHERE id_user = $1';
    const { rows } = await pool.query(query, [id_user]);
    return rows[0] || null;
};

const deleteUser = async (id_user) => {
    await pool.query('DELETE FROM users WHERE id_user = $1', [id_user]);
};

module.exports = {
    checkDuplicateUser, 
    getUserByUsernameWithSppg, 
    createUserTx,
    getAllUsers, 
    checkRoleInSppg, 
    createUser, 
    checkDuplicateExcludeId,
    updateUser, 
    getUserById, 
    deleteUser
};