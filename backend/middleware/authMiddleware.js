const jwt = require('jsonwebtoken');

// Fungsi satpam untuk mengecek token
const verifyToken = (req, res, next) => {
    // 1. Mengambil header Authorization dari permintaan Frontend
    const authHeader = req.header('Authorization');

    // Jika tidak ada header sama sekali, tolak akses
    if (!authHeader) {
        return res.status(401).json({ pesan: "Akses ditolak. Anda harus login terlebih dahulu!" });
    }

    // 2. Mengambil tokennya saja (menghilangkan kata 'Bearer ')
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ pesan: "Format token salah!" });
    }

    try {
        // 3. Memeriksa keaslian token dengan kunci rahasia kita
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Menyimpan data user dari token ke dalam 'req.user'
        // Data ini berisi { id_user, id_role, id_sppg } sesuai yang kita buat saat Login
        req.user = decoded;

        // 5. Mengizinkan permintaan lanjut ke tahap berikutnya (Controller)
        next();
    } catch (error) {
        // Jika token palsu atau sudah kadaluarsa
        res.status(403).json({ pesan: "Token tidak valid atau sudah kadaluarsa!" });
    }
};

module.exports = { verifyToken };