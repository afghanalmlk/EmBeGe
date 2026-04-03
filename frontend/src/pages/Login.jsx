import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- Tambahkan Link
import api from '../api/axiosInstance';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false); // Tambahkan state loading
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true); // Mulai loading saat tombol ditekan

    try {
      // Tidak perlu lagi menulis full URL 'http://localhost:5000', cukup path-nya saja
      const response = await api.post('/auth/login', { username, password });
      // Axios otomatis melakukan parsing JSON, datanya ada di response.data
      const { token, user } = response.data;
      // Simpan semua data krusial ke brankas browser (localStorage)
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.id_role);
      localStorage.setItem('username', user.username);
      localStorage.setItem('alamat_sppg', response.data.user.alamat_sppg)
      // Simpan nama SPPG jika ada (berguna untuk ditampilkan di UI Layout)
      if (user.nama_sppg) {
        localStorage.setItem('nama_sppg', user.nama_sppg);
      }
      setSuccessMsg(`Selamat datang, ${user.username}!`);
      setTimeout(() => {
        navigate('/menu');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.pesan || 'Gagal terhubung ke server. Periksa koneksi Anda.');
      setLoading(false); // Matikan loading hanya jika error (karena jika sukses, jeda dihandle setTimeout)
    }  
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">EmBeGe Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(''); // Hapus error saat user mulai mengetik
              }}
              disabled={loading} // Kunci input saat loading
              required 
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(''); // Hapus error saat user mulai mengetik
              }}
              disabled={loading} // Kunci input saat loading
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} // Kunci tombol saat loading agar tidak terkirim dobel
            className={`w-full text-white font-bold py-2 px-4 rounded-md transition duration-200 
              ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* 2. TAMBAHKAN BAGIAN INI DI BAWAH FORM */}
        <p className="mt-6 text-center text-sm text-gray-600">
          SPPG Anda belum terdaftar?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition duration-150">
            Daftar Dapur Baru
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;