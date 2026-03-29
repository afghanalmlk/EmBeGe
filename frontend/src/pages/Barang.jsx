import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Barang = () => {
  const [barangList, setBarangList] = useState([]);
  const [namaBarang, setNamaBarang] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  // Mengambil Role dari penyimpanan untuk mengatur hak akses UI
  const role = localStorage.getItem('role'); 
  const token = localStorage.getItem('token');

  // Fungsi mengambil daftar barang
  const fetchBarang = async () => {
    try {
      const response = await fetch('http://localhost:5000/barang', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        setBarangList(data.data);
      } else {
        setError(data.pesan);
        if (response.status === 401) navigate('/login');
      }
    } catch (err) {
      setError('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchBarang();
  }, [navigate, token]);

  // Fungsi menambah barang baru (Hanya Superadmin)
  const handleTambahBarang = async (e) => {
    e.preventDefault();
    if (!namaBarang.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/barang', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nama_barang: namaBarang })
      });
      
      const data = await response.json();
      if (response.ok) {
        setNamaBarang(''); // Kosongkan input
        fetchBarang(); // Refresh tabel secara otomatis
      } else {
        alert(data.pesan);
      }
    } catch (err) {
      alert('Gagal menambah barang.');
    }
  };

  // Fungsi menghapus barang (Hanya Superadmin)
  const handleHapusBarang = async (id_barang) => {
    const konfirmasi = window.confirm('Apakah Anda yakin ingin menghapus barang ini?');
    if (!konfirmasi) return;

    try {
      const response = await fetch(`http://localhost:5000/barang/${id_barang}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        // Hapus dari state tanpa perlu refresh halaman
        setBarangList(barangList.filter(b => b.id_barang !== id_barang));
      } else {
        alert(data.pesan);
      }
    } catch (err) {
      alert('Gagal menghapus barang. Pastikan barang tidak sedang terpakai di Menu/PO.');
    }
  };

  return (
    <Layout title="Master Barang">
      <div className="space-y-6">
        
        {/* Pesan Error Global */}
        {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl font-medium">{error}</div>}

        {/* FORM TAMBAH BARANG (Disembunyikan jika bukan Superadmin) */}
        {role === '1' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tambah Barang Baru</h3>
            <form onSubmit={handleTambahBarang} className="flex gap-4">
              <input 
                type="text" 
                placeholder="Masukkan nama bahan baku (Contoh: Bawang Merah)" 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200 shadow-sm"
              >
                + Simpan Barang
              </button>
            </form>
          </div>
        )}

        {/* TABEL DAFTAR BARANG */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Barang</th>
                {/* Kolom Aksi hanya muncul untuk Superadmin */}
                {role === '1' && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-500">Memuat data dari server...</td></tr>
              ) : barangList.length === 0 ? (
                <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-500">Belum ada data barang.</td></tr>
              ) : (
                barangList.map((barang) => (
                  <tr key={barang.id_barang} className="hover:bg-blue-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-500">
                      #{barang.id_barang}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                      {barang.nama_barang}
                    </td>
                    {role === '1' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button 
                          onClick={() => handleHapusBarang(barang.id_barang)}
                          className="text-red-500 hover:text-red-700 font-semibold bg-red-50 hover:bg-red-100 py-1.5 px-3 rounded-md transition duration-200"
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
      </div>
    </Layout>
  );
};

export default Barang;