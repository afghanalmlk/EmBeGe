import { useState, useEffect } from 'react';
import api from '../api/axiosInstance'; // Import axios instance
import Layout from '../components/Layout';

const Barang = () => {
  const [barangList, setBarangList] = useState([]);
  const [namaBarang, setNamaBarang] = useState('');
  
  // State Management
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Mengambil Role dari penyimpanan untuk mengatur hak akses UI
  // Note: Tidak perlu panggil token lagi, axiosInstance sudah mengurusnya!
  const role = localStorage.getItem('role'); 

  // Fungsi mengambil daftar barang
  const fetchBarang = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/barang');
      setBarangList(response.data.data);
    } catch (err) {
      setError(err.response?.data?.pesan || 'Gagal terhubung ke server saat mengambil data barang.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, []);

  // Fungsi menambah barang baru (Hanya Superadmin)
  const handleTambahBarang = async (e) => {
    e.preventDefault();
    if (!namaBarang.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/barang', { nama_barang: namaBarang });
      setNamaBarang(''); // Kosongkan input
      fetchBarang(); // Refresh tabel secara otomatis
    } catch (err) {
      alert(err.response?.data?.pesan || 'Gagal menambah barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi menghapus barang (Hanya Superadmin)
  const handleHapusBarang = async (id_barang) => {
    const konfirmasi = window.confirm('Apakah Anda yakin ingin menghapus barang ini?');
    if (!konfirmasi) return;

    try {
      await api.delete(`/barang/${id_barang}`);
      // Hapus dari state tanpa perlu refresh halaman penuh
      setBarangList(barangList.filter(b => b.id_barang !== id_barang));
    } catch (err) {
      alert(err.response?.data?.pesan || 'Gagal menghapus barang. Pastikan barang tidak sedang terpakai di Menu/PO.');
    }
  };

  return (
    <Layout title="Master Barang">
      <div className="space-y-6">
        
        {/* Pesan Error Global */}
        {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl font-medium">{error}</div>}

        {/* FORM TAMBAH BARANG (Disembunyikan jika bukan Superadmin Role 1) */}
        {role === '1' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tambah Barang Baru</h3>
            <form onSubmit={handleTambahBarang} className="flex gap-4">
              <input 
                type="text" 
                placeholder="Masukkan nama bahan baku (Contoh: Bawang Merah)" 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`text-white font-bold py-2 px-6 rounded-lg transition duration-200 shadow-sm
                  ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isSubmitting ? 'Menyimpan...' : '+ Simpan Barang'}
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