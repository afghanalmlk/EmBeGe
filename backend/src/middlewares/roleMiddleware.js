// src/middlewares/roleMiddleware.js
const authModel = require('../models/authModel');

// ==========================================
// 1. DYNAMIC ROLE CHECKERS (Lebih Clean & DRY)
// ==========================================

// Hanya mengizinkan role tertentu (contoh: allowRoles([1]) untuk Superadmin)
const allowRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.id_role)) {
            return res.status(403).json({ pesan: "Akses ditolak. Fitur ini hanya untuk Superadmin." });
        }
        next();
    };
};

// Memblokir role tertentu (contoh: forbidRoles([3, 4]) untuk blokir Gizi & Akuntan)
const forbidRoles = (forbiddenRoles, customMessage) => {
    return (req, res, next) => {
        if (forbiddenRoles.includes(req.user.id_role)) {
            const msg = customMessage || "Akses ditolak. Anda hanya diperbolehkan melihat data.";
            return res.status(403).json({ pesan: msg });
        }
        next();
    };
};

// 2. RESOURCE AUTHORIZATION (Kepemilikan Data SPPG)

const authorizeSPPG = (tableName, idColumnName) => {
    return async (req, res, next) => {
        try {
            if (req.user.id_role === 1) return next(); // Superadmin bebas

            const data = await authModel.getResourceSppgId(tableName, idColumnName, req.params.id);
            
            if (!data) return res.status(404).json({ pesan: "Data tidak ditemukan." });
            if (data.id_sppg !== req.user.id_sppg) return res.status(403).json({ pesan: "Akses ditolak. Ini bukan data milik SPPG Anda!" });

            next();
        } catch (error) {
            console.error(`Error authorizeSPPG di tabel ${tableName}:`, error.message);
            res.status(500).json({ pesan: "Terjadi kesalahan server saat memvalidasi otorisasi akses." });
        }
    };
};

const authorizeGizi = async (req, res, next) => {
    try {
        if (req.user.id_role === 1) return next();

        const data = await authModel.getGiziSppgId(req.params.id);
        
        if (!data) return res.status(404).json({ pesan: "Data gizi tidak ditemukan." });
        if (data.id_sppg !== req.user.id_sppg) return res.status(403).json({ pesan: "Akses ditolak. Bukan data Gizi dari SPPG Anda." });
        
        next();
    } catch (error) { 
        console.error("Error authorizeGizi:", error.message);
        res.status(500).json({ pesan: "Error validasi otorisasi Gizi." }); 
    }
};

const authorizeMenuParent = async (req, res, next) => {
    try {
        if (req.user.id_role === 1) return next();
        if (!req.body.id_menu) return res.status(400).json({ pesan: "ID Menu wajib disertakan." });

        const data = await authModel.getMenuSppgId(req.body.id_menu);
        
        if (!data) return res.status(404).json({ pesan: "Menu tidak ditemukan." });
        if (data.id_sppg !== req.user.id_sppg) return res.status(403).json({ pesan: "Akses ditolak. Anda tidak bisa menambah gizi ke Menu milik SPPG lain." });

        next();
    } catch (error) { 
        console.error("Error authorizeMenuParent:", error.message);
        res.status(500).json({ pesan: "Error validasi Parent Menu." }); 
    }
};

module.exports = { allowRoles, forbidRoles, authorizeSPPG, authorizeGizi, authorizeMenuParent };