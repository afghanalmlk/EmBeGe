// src/models/sppgModel.js
// Bertanggung jawab khusus untuk query data SPPG
const pool = require('../config/db');

/**
 * Menyimpan data SPPG menggunakan transaction client
 */
const createSppgTx = async (client, data) => {
    const query = `
        INSERT INTO sppg (nama_sppg, kelurahan_desa, kecamatan, kabupaten_kota, provinsi, alamat) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id_sppg, nama_sppg
    `;
    const values = [
        data.nama_sppg, data.kelurahan_desa, data.kecamatan, 
        data.kabupaten_kota, data.provinsi, data.alamat
    ];
    const { rows } = await client.query(query, values);
    return rows[0];
};

module.exports = { createSppgTx };