// src/models/poModel.js
const pool = require('../config/db');

const getAllPO = async (roleId, sppgId) => {
    let queryStr = `
        SELECT p.id_po, p.tanggal_po, p.status_po, m.nama_menu, u.username AS pembuat,
            SUM(dp.qty_barang * dp.harga_barang) AS total_harga,
            json_agg(json_build_object(
                'nama_barang', b.nama_barang, 'qty', dp.qty_barang, 
                'satuan', dp.satuan, 'harga_satuan', dp.harga_barang, 
                'subtotal', (dp.qty_barang * dp.harga_barang)
            )) AS rincian_barang,
            (SELECT json_agg(json_build_object('action', hp.action, 'action_at', hp.action_at, 'action_by', u2.username) ORDER BY hp.action_at DESC)
             FROM (SELECT DISTINCT action, action_at, action_by FROM histori_po hp
                   JOIN detail_po dp_hist ON hp.id_detail_po = dp_hist.id_detail_po
                   WHERE dp_hist.id_po = p.id_po) hp
             JOIN users u2 ON hp.action_by = u2.id_user
            ) AS histori
        FROM po p
        JOIN jadwal_menu j ON p.id_jadwal_menu = j.id_jadwal
        JOIN menu m ON j.id_menu = m.id_menu
        JOIN users u ON p.created_by = u.id_user
        JOIN detail_po dp ON p.id_po = dp.id_po
        JOIN barang b ON dp.id_barang = b.id_barang
    `;
    let queryParams = [];

    if (roleId === 1) {
        queryStr += ` GROUP BY p.id_po, m.nama_menu, u.username ORDER BY p.tanggal_po DESC`;
    } else {
        queryStr += ` WHERE u.id_sppg = $1 GROUP BY p.id_po, m.nama_menu, u.username ORDER BY p.tanggal_po DESC`;
        queryParams.push(sppgId);
    }
    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
};

// --- TRANSACTION QUERIES ---
const checkJadwalMenuSppgTx = async (client, id_jadwal_menu) => {
    const query = `SELECT u.id_sppg FROM jadwal_menu j JOIN menu m ON j.id_menu = m.id_menu JOIN users u ON m.created_by = u.id_user WHERE j.id_jadwal = $1`;
    const { rows } = await client.query(query, [id_jadwal_menu]);
    return rows[0] || null;
};

const createPOTx = async (client, id_jadwal_menu, tanggal_po, id_user) => {
    const { rows } = await client.query(`INSERT INTO po (id_jadwal_menu, tanggal_po, created_by) VALUES ($1, $2, $3) RETURNING id_po`, [id_jadwal_menu, tanggal_po, id_user]);
    return rows[0].id_po;
};

const createDetailPOTx = async (client, id_po, id_barang, qty_barang, harga_barang, satuan) => {
    const { rows } = await client.query(`INSERT INTO detail_po (id_po, id_barang, qty_barang, harga_barang, satuan) VALUES ($1, $2, $3, $4, $5) RETURNING id_detail_po`, [id_po, id_barang, qty_barang, harga_barang, satuan]);
    return rows[0].id_detail_po;
};

const createHistoriPOTx = async (client, id_detail_po, action, id_user) => {
    await client.query(`INSERT INTO histori_po (id_detail_po, action, action_by) VALUES ($1, $2, $3)`, [id_detail_po, action, id_user]);
};

const updateStatusPOTx = async (client, id_po, status_po) => {
    await client.query('UPDATE po SET status_po = $1 WHERE id_po = $2', [status_po, id_po]);
};

const getDetailPOIdsTx = async (client, id_po) => {
    const { rows } = await client.query('SELECT id_detail_po FROM detail_po WHERE id_po = $1', [id_po]);
    return rows;
};

// --- NORMAL QUERIES ---
const getPOStatus = async (id_po) => {
    const { rows } = await pool.query(`SELECT status_po FROM po WHERE id_po = $1`, [id_po]);
    return rows[0] || null;
};

const deletePO = async (id_po) => {
    await pool.query('DELETE FROM po WHERE id_po = $1', [id_po]);
};

module.exports = { getAllPO, checkJadwalMenuSppgTx, createPOTx, createDetailPOTx, createHistoriPOTx, updateStatusPOTx, getDetailPOIdsTx, getPOStatus, deletePO };