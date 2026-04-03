// src/controllers/userController.js
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

/**
 * Mendapatkan daftar user berdasarkan Role dan SPPG peminta
 */
const getUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers(req.user.id_role, req.user.id_sppg);
        res.status(200).json({ pesan: "Berhasil memuat data user", data: users });
    } catch (error) {
        console.error("Backend Error getUser:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan saat mengambil data user dari database." });
    }
};

/**
 * Menambahkan user (Pegawai) baru
 */
const addUser = async (req, res) => {
    try {
        let { username, password, email, no_telp, id_role, id_sppg } = req.body;
        const targetRole = Number(id_role);
        let targetSppg = req.user.id_sppg; 
        
        // 1. Validasi Otorisasi
        if (req.user.id_role === 1) {
            if (!id_sppg) return res.status(400).json({ pesan: "Superadmin wajib memilih SPPG tujuan." });
            targetSppg = id_sppg;
        } else if (req.user.id_role === 2) {
            if (targetRole !== 3 && targetRole !== 4) {
                return res.status(403).json({ pesan: "Pelanggaran wewenang! Anda hanya bisa membuat akun untuk Ahli Gizi dan Akuntan." });
            }
        } else {
            return res.status(403).json({ pesan: "Akses ditolak! Anda tidak memiliki wewenang menambah pegawai." });
        }

        // 2. Validasi Maksimal 1 Pegawai Per Role
        const cekRole = await userModel.checkRoleInSppg(targetSppg, targetRole);
        if (cekRole.length > 0) return res.status(400).json({ pesan: "Posisi ini sudah terisi di SPPG tersebut! Maksimal 1 pegawai untuk setiap role." });

        // 3. Validasi Duplikasi Identitas
        const cekDuplikat = await userModel.checkDuplicateUser(username, email);
        if (cekDuplikat.length > 0) return res.status(400).json({ pesan: "Username atau Email tersebut sudah terdaftar di sistem!" });

        // 4. Proses Simpan
        const finalPassword = (!password || password.trim() === '') ? '1234' : password;
        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        const newUser = await userModel.createUser({
            id_role: targetRole, id_sppg: targetSppg, username, password: hashedPassword, email, no_telp
        });

        res.status(201).json({
            pesan: `Akun Pegawai berhasil dibuat! ${!password ? '(Menggunakan Password Default: 1234)' : ''}`,
            user: newUser
        });
    } catch (error) {
        console.error("Error add user:", error.message);
        res.status(500).json({ pesan: "Terjadi kesalahan pada server saat membuat akun." });
    }
};

/**
 * Mengubah data user
 */
const editUser = async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        
        if (req.user.id_user !== targetId && req.user.id_role !== 1) {
            return res.status(403).json({ pesan: "Anda hanya diizinkan mengubah data profil Anda sendiri." });
        }

        const { username, email, no_telp, password } = req.body;

        // Cek Duplikasi ke user lain
        const cekDuplikat = await userModel.checkDuplicateExcludeId(username, email, targetId);
        if (cekDuplikat.length > 0) return res.status(400).json({ pesan: "Username atau Email sudah dipakai pengguna lain!" });
        
        let updateData = { username, email, no_telp };
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        await userModel.updateUser(targetId, updateData);
        res.status(200).json({ pesan: "Data Profil berhasil diperbarui!" });
    } catch (error) { 
        res.status(500).json({ pesan: "Terjadi kesalahan saat memperbarui profil." }); 
    }
};

/**
 * Menghapus user
 */
const hapusUser = async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        const dataTarget = await userModel.getUserById(targetId);
        
        if (!dataTarget) return res.status(404).json({ pesan: "User tidak ditemukan" });
        if (dataTarget.id_role === 1) return res.status(403).json({ pesan: "Akun Superadmin tidak bisa dihapus." });

        if (req.user.id_role === 1) {
            await userModel.deleteUser(targetId);
            return res.json({ pesan: "Pegawai berhasil dihapus oleh Superadmin" });
        } else if (req.user.id_role === 2) {
            if (dataTarget.id_sppg === req.user.id_sppg) {
                if (targetId === req.user.id_user) return res.status(400).json({ pesan: "KaSPPG tidak dapat menghapus akunnya sendiri."});
                await userModel.deleteUser(targetId);
                return res.json({ pesan: "Pegawai SPPG berhasil dihapus" });
            } else {
                return res.status(403).json({ pesan: "Akses ditolak. Bukan pegawai dari SPPG Anda." });
            }
        }
        return res.status(403).json({ pesan: "Anda tidak memiliki wewenang untuk menghapus user." });
    } catch (error) { 
        res.status(500).json({ pesan: "Gagal menghapus! User masih terikat dengan data transaksi pembuatan Menu/PO/Invoice." }); 
    }
};

module.exports = { getUsers, addUser, editUser, hapusUser };