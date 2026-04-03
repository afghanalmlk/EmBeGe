// src/models/invoiceModel.js
const pool = require('../config/db');

const getAllInvoice = async (roleId, sppgId) => {
    let queryStr = `
        SELECT i.id_invoice, i.tanggal_invoice, i.supplier, i.id_po, i.status_invoice, u.username AS pembuat,
            COALESCE(SUM(di.harga_fix * di.qty), 0) AS total_tagihan,
            json_agg(json_build_object('nama_barang', b.nama_barang, 'qty', di.qty, 'satuan', di.satuan, 'harga_satuan', di.harga_fix, 'subtotal', (di.qty * di.harga_fix))) FILTER (WHERE di.id_detail_invoice IS NOT NULL) AS rincian_tagihan
        FROM invoice i
        JOIN users u ON i.created_by = u.id_user
        LEFT JOIN detail_invoice di ON i.id_invoice = di.id_invoice
        LEFT JOIN barang b ON di.id_barang = b.id_barang
    `;
    let queryParams = [];

    if (roleId !== 1) {
        queryStr += ` WHERE u.id_sppg = $1`;
        queryParams.push(sppgId);
    }
    queryStr += ` GROUP BY i.id_invoice, u.username ORDER BY i.tanggal_invoice DESC`;

    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
};

const createInvoiceTx = async (client, id_po, tanggal_invoice, supplier, id_user) => {
    const { rows } = await client.query(`INSERT INTO invoice (id_po, tanggal_invoice, supplier, created_by, status_invoice) VALUES ($1, $2, $3, $4, 'Pending') RETURNING id_invoice`, [id_po, tanggal_invoice, supplier, id_user]);
    return rows[0].id_invoice;
};

const createDetailInvoiceTx = async (client, id_invoice, item) => {
    await client.query(`INSERT INTO detail_invoice (id_invoice, id_barang, harga_fix, qty, satuan) VALUES ($1, $2, $3, $4, $5)`, [id_invoice, item.id_barang, item.harga_fix, item.qty, item.satuan]);
};

const updateInvoice = async (id_invoice, data) => {
    await pool.query('UPDATE invoice SET tanggal_invoice=$1, supplier=$2 WHERE id_invoice=$3', [data.tanggal_invoice, data.supplier, id_invoice]);
};

const deleteInvoice = async (id_invoice) => {
    await pool.query('DELETE FROM invoice WHERE id_invoice = $1', [id_invoice]);
};

const updateStatusInvoice = async (id_invoice, status_invoice) => {
    await pool.query('UPDATE invoice SET status_invoice = $1 WHERE id_invoice = $2', [status_invoice, id_invoice]);
};

module.exports = { getAllInvoice, createInvoiceTx, createDetailInvoiceTx, updateInvoice, deleteInvoice, updateStatusInvoice };