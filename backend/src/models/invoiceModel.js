const pool = require('../config/db');

const getAllInvoice = async (roleId, sppgId) => {
    let queryStr = `
        SELECT i.id_invoice, i.tanggal_invoice, i.supplier, i.id_po, i.status_invoice, i.catatan_kasppg, i.created_by,
               m.nama_menu, j.tanggal AS tanggal_jadwal, u.username AS pembuat,
            COALESCE(SUM(di.harga_fix * di.qty), 0) AS total_tagihan,
            json_agg(json_build_object(
                'id_barang', b.id_barang,
                'nama_barang', b.nama_barang, 
                'qty', di.qty, 
                'satuan', di.satuan, 
                'harga_po', (SELECT dp.harga_barang FROM detail_po dp WHERE dp.id_po = i.id_po AND dp.id_barang = di.id_barang LIMIT 1),
                'harga_fix', di.harga_fix, 
                'subtotal', (di.qty * di.harga_fix)
            )) FILTER (WHERE di.id_detail_invoice IS NOT NULL) AS rincian_tagihan,
            
            COALESCE(
                (SELECT json_agg(json_build_object('action', hi.action, 'action_at', hi.action_at, 'action_by', u2.username) ORDER BY hi.action_at DESC) 
                 FROM histori_invoice hi 
                 JOIN users u2 ON hi.action_by = u2.id_user 
                 WHERE hi.id_invoice = i.id_invoice
                ), '[]'::json
            ) AS histori
        FROM invoice i
        JOIN users u ON i.created_by = u.id_user
        JOIN po p ON i.id_po = p.id_po
        JOIN jadwal_menu j ON p.id_jadwal_menu = j.id_jadwal
        JOIN menu m ON j.id_menu = m.id_menu
        LEFT JOIN detail_invoice di ON i.id_invoice = di.id_invoice
        LEFT JOIN barang b ON di.id_barang = b.id_barang
    `;
    let queryParams = [];

    if (roleId !== 1) {
        queryStr += ` WHERE u.id_sppg = $1`;
        queryParams.push(sppgId);
    }
    
    queryStr += ` GROUP BY i.id_invoice, m.nama_menu, j.tanggal, u.username, i.created_by, i.catatan_kasppg ORDER BY i.tanggal_invoice DESC`;

    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
};

// --- TRANSACTIONS ---
const createInvoiceTx = async (client, id_po, tanggal_invoice, supplier, id_user) => {
    const { rows } = await client.query(`INSERT INTO invoice (id_po, tanggal_invoice, supplier, created_by, status_invoice) VALUES ($1, $2, $3, $4, 'Pending') RETURNING id_invoice`, [id_po, tanggal_invoice, supplier, id_user]);
    return rows[0].id_invoice;
};

const createDetailInvoiceTx = async (client, id_invoice, item) => {
    await client.query(`INSERT INTO detail_invoice (id_invoice, id_barang, harga_fix, qty, satuan) VALUES ($1, $2, $3, $4, $5)`, [id_invoice, item.id_barang, item.harga_fix, item.qty, item.satuan]);
};

const createHistoriInvoiceTx = async (client, id_invoice, action, id_user) => {
    await client.query(`INSERT INTO histori_invoice (id_invoice, action, action_by) VALUES ($1, $2, $3)`, [id_invoice, action, id_user]);
};

const updateStatusInvoiceTx = async (client, id_invoice, status_invoice, catatan = null) => {
    await client.query('UPDATE invoice SET status_invoice = $1, catatan_kasppg = $2 WHERE id_invoice = $3', [status_invoice, catatan, id_invoice]);
};

// --- TAMBAHAN UNTUK REVISI INVOICE ---
const updateInvoiceHeaderTx = async (client, id_invoice, id_po, tanggal_invoice, supplier) => {
    await client.query(`UPDATE invoice SET id_po = $1, tanggal_invoice = $2, supplier = $3, status_invoice = 'Pending', catatan_kasppg = NULL WHERE id_invoice = $4`, [id_po, tanggal_invoice, supplier, id_invoice]);
};

const deleteDetailInvoiceTx = async (client, id_invoice) => {
    await client.query(`DELETE FROM detail_invoice WHERE id_invoice = $1`, [id_invoice]);
};

// --- NORMAL QUERIES ---
const getInvoiceStatus = async (id_invoice) => {
    const { rows } = await pool.query(`SELECT status_invoice, created_by FROM invoice WHERE id_invoice = $1`, [id_invoice]);
    return rows[0] || null;
};

module.exports = { 
    getAllInvoice, 
    createInvoiceTx, 
    createDetailInvoiceTx, 
    createHistoriInvoiceTx,
    updateStatusInvoiceTx, 
    updateInvoiceHeaderTx, 
    deleteDetailInvoiceTx, 
    getInvoiceStatus 
};