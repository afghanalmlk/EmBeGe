const pool = require('../config/db');

const getAllPO = async (roleId, sppgId) => {
    let queryStr = `
        SELECT p.id_po, p.tanggal_po, p.status_po, p.catatan_kasppg, m.nama_menu, j.tanggal AS tanggal_jadwal, u.username AS pembuat, p.created_by,
            SUM(dp.qty_barang * dp.harga_barang) AS total_harga,
            json_agg(json_build_object(
                'id_barang', b.id_barang,
                'nama_barang', b.nama_barang, 'qty', dp.qty_barang, 
                'satuan', dp.satuan, 'harga_satuan', dp.harga_barang, 
                'subtotal', (dp.qty_barang * dp.harga_barang)
            )) AS rincian_barang,
            COALESCE(
                (SELECT json_agg(json_build_object('action', hp.action, 'action_at', hp.action_at, 'action_by', u2.username) ORDER BY hp.action_at DESC)
                 FROM histori_po hp
                 JOIN users u2 ON hp.action_by = u2.id_user
                 WHERE hp.id_po = p.id_po), 
                 '[]'::json
            ) AS histori
        FROM po p
        JOIN jadwal_menu j ON p.id_jadwal_menu = j.id_jadwal
        JOIN menu m ON j.id_menu = m.id_menu
        JOIN users u ON p.created_by = u.id_user
        JOIN detail_po dp ON p.id_po = dp.id_po
        JOIN barang b ON dp.id_barang = b.id_barang
    `;
    let queryParams = [];

    // Tambahkan p.catatan_kasppg ke dalam GROUP BY
    if (roleId === 1) {
        queryStr += ` GROUP BY p.id_po, m.nama_menu, j.tanggal, u.username, p.created_by, p.catatan_kasppg ORDER BY p.tanggal_po DESC`;
    } else {
        queryStr += ` WHERE u.id_sppg = $1 GROUP BY p.id_po, m.nama_menu, j.tanggal, u.username, p.created_by, p.catatan_kasppg ORDER BY p.tanggal_po DESC`;
        queryParams.push(sppgId);
    }
    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
};

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
    await client.query(`INSERT INTO detail_po (id_po, id_barang, qty_barang, harga_barang, satuan) VALUES ($1, $2, $3, $4, $5)`, [id_po, id_barang, qty_barang, harga_barang, satuan]);
};

const createHistoriPOTx = async (client, id_po, action, id_user) => {
    await client.query(`INSERT INTO histori_po (id_po, action, action_by) VALUES ($1, $2, $3)`, [id_po, action, id_user]);
};

// Update status kini menyertakan kolom catatan (untuk penolakan)
const updateStatusPOTx = async (client, id_po, status_po, catatan = null) => {
    await client.query('UPDATE po SET status_po = $1, catatan_kasppg = $2 WHERE id_po = $3', [status_po, catatan, id_po]);
};

const updatePOHeaderTx = async (client, id_po, id_jadwal_menu, tanggal_po) => {
    // Saat direvisi, kembalikan status ke Pending dan hapus catatan penolakan sebelumnya
    await client.query(`UPDATE po SET id_jadwal_menu = $1, tanggal_po = $2, status_po = 'Pending', catatan_kasppg = NULL WHERE id_po = $3`, [id_jadwal_menu, tanggal_po, id_po]);
};

const deleteDetailPOTx = async (client, id_po) => {
    await client.query(`DELETE FROM detail_po WHERE id_po = $1`, [id_po]);
};

const getDetailPOIdsTx = async (client, id_po) => {
    const { rows } = await client.query('SELECT id_detail_po FROM detail_po WHERE id_po = $1', [id_po]);
    return rows;
};

const getPOStatus = async (id_po) => {
    const { rows } = await pool.query(`SELECT status_po, created_by FROM po WHERE id_po = $1`, [id_po]);
    return rows[0] || null;
};

// Fungsi hapus ditiadakan sesuai instruksi
module.exports = { 
    getAllPO, checkJadwalMenuSppgTx, createPOTx, createDetailPOTx, createHistoriPOTx, 
    updateStatusPOTx, updatePOHeaderTx, deleteDetailPOTx, getDetailPOIdsTx, getPOStatus 
};