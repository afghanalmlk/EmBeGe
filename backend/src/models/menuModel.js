const pool = require('../config/db');

// --- TRANSACTIONS UNTUK MASTER MENU ---
const createMenuTx = async (client, nama_menu, id_user) => {
    const { rows } = await client.query(
        "INSERT INTO menu (nama_menu, status_menu, created_by) VALUES ($1, 'Pending Akuntan', $2) RETURNING id_menu", 
        [nama_menu, id_user]
    );
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

// --- TRANSACTIONS UNTUK JADWAL ---
const createJadwalMenuTx = async (client, data) => {
    const query = `INSERT INTO jadwal_menu (id_menu, id_penerima, tanggal, qty_porsi_besar, qty_porsi_kecil, created_by) VALUES ($1, $2, $3, $4, $5, $6)`;
    const values = [data.id_menu, data.id_penerima, data.tanggal, data.qty_porsi_besar, data.qty_porsi_kecil, data.id_user];
    await client.query(query, values);
};

// --- QUERIES GETTER ---
const getAllMasterMenu = async (roleId, sppgId) => {
    let queryStr = `
        SELECT m.id_menu, m.nama_menu, m.status_menu, m.catatan_akuntan, u.username as pembuat,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id_detail_menu', dm.id_detail_menu, 
                        'id_barang', b.id_barang, 
                        'nama_barang', b.nama_barang, 
                        'is_approved_akuntan', dm.is_approved_akuntan
                    )
                ) FILTER (WHERE dm.id_detail_menu IS NOT NULL), '[]'
            ) as bahan_bahan
        FROM menu m
        JOIN users u ON m.created_by = u.id_user
        LEFT JOIN detail_menu dm ON m.id_menu = dm.id_menu
        LEFT JOIN barang b ON dm.id_barang = b.id_barang
    `;
    let queryParams = [];

    if (roleId !== 1) {
        queryStr += ` WHERE u.id_sppg = $1`;
        queryParams.push(sppgId);
    }
    queryStr += ` GROUP BY m.id_menu, u.username ORDER BY m.id_menu DESC`;

    const { rows } = await pool.query(queryStr, queryParams);
    return rows;
};

const getAllJadwalMenu = async (roleId, sppgId) => {
    let queryStr = `
        SELECT j.id_jadwal, j.id_menu, m.nama_menu, j.tanggal, p.nama_penerima, j.qty_porsi_besar, j.qty_porsi_kecil
        FROM jadwal_menu j
        JOIN menu m ON j.id_menu = m.id_menu
        JOIN users u ON j.created_by = u.id_user
        JOIN penerima_manfaat p ON j.id_penerima = p.id_penerima
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

// --- UPDATES & DELETES ---
const deleteMenu = async (id_menu) => { await pool.query('DELETE FROM menu WHERE id_menu = $1', [id_menu]); };
const deleteJadwal = async (id_jadwal) => { await pool.query('DELETE FROM jadwal_menu WHERE id_jadwal = $1', [id_jadwal]); };

module.exports = { 
    createMenuTx, getBarangByNameTx, createBarangTx, createDetailMenuTx, createJadwalMenuTx, 
    getAllMasterMenu, getAllJadwalMenu, deleteMenu, deleteJadwal 
};