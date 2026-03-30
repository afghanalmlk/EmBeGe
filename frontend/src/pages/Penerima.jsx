import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import Layout from '../components/Layout';

const Penerima = () => {
  const [penerimaList, setPenerimaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [editId, setEditId] = useState(null); // Jika null berarti mode Tambah, jika ada ID berarti mode Edit
  const [formData, setFormData] = useState({
    nama_penerima: '',
    alamat: '',
    qty_porsi_besar: '',
    qty_porsi_kecil: ''
  });

  const role = localStorage.getItem('role');
  // Hanya Superadmin (1) dan KaSPPG (2) yang boleh Tambah/Edit/Hapus
  const isAuthorized = role === '1' || role === '2';

  const fetchPenerima = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/penerima');
      setPenerimaList(res.data.data);
    } catch (err) {
      setError('Gagal memuat data penerima manfaat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenerima();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_penerima.trim()) return alert("Nama penerima wajib diisi!");

    setIsSubmitting(true);
    try {
      const payload = {
        nama_penerima: formData.nama_penerima,
        alamat: formData.alamat,
        qty_porsi_besar: parseInt(formData.qty_porsi_besar) || 0,
        qty_porsi_kecil: parseInt(formData.qty_porsi_kecil) || 0,
      };

      if (editId) {
        // Mode Edit
        await api.put(`/penerima/${editId}`, payload);
        alert('Data penerima berhasil diperbarui!');
      } else {
        // Mode Tambah
        await api.post('/penerima', payload);
        alert('Penerima baru berhasil ditambahkan!');
      }

      // Reset Form & Refresh Data
      handleCancelEdit();
      fetchPenerima();
    } catch (err) {
      alert(err.response?.data?.pesan || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (p) => {
    setEditId(p.id_penerima);
    setFormData({
      nama_penerima: p.nama_penerima,
      alamat: p.alamat || '',
      qty_porsi_besar: p.qty_porsi_besar,
      qty_porsi_kecil: p.qty_porsi_kecil
    });
    // Scroll layar ke atas agar form edit terlihat
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({ nama_penerima: '', alamat: '', qty_porsi_besar: '', qty_porsi_kecil: '' });
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Hapus data penerima ini? Data jadwal menu yang terkait mungkin ikut terpengaruh.')) return;
    try {
      await api.delete(`/penerima/${id}`);
      setPenerimaList(penerimaList.filter(p => p.id_penerima !== id));
    } catch (err) {
      alert(err.response?.data?.pesan || 'Gagal menghapus data penerima.');
    }
  };

  return (
    <Layout title="Data Penerima Manfaat">
      <div className="space-y-6">
        
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">{error}</div>}

        {/* --- FORM TAMBAH / EDIT (Hanya tampil jika diizinkan) --- */}
        {isAuthorized && (
          <div className={`p-6 rounded-xl shadow-sm border transition-colors ${editId ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${editId ? 'text-yellow-800' : 'text-blue-900'}`}>
              {editId ? 'Ubah Data Penerima' : 'Tambah Penerima Baru'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nama Penerima / Panti / Lembaga</label>
                  <input 
                    type="text" name="nama_penerima" required 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    value={formData.nama_penerima} onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Alamat Lengkap</label>
                  <input 
                    type="text" name="alamat" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    value={formData.alamat} onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Target Porsi Besar (Default)</label>
                  <input 
                    type="number" min="0" name="qty_porsi_besar" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    value={formData.qty_porsi_besar} onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Target Porsi Kecil (Default)</label>
                  <input 
                    type="number" min="0" name="qty_porsi_kecil" 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    value={formData.qty_porsi_kecil} onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {editId && (
                  <button type="button" onClick={handleCancelEdit} className="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition">
                    Batal Edit
                  </button>
                )}
                <button type="submit" disabled={isSubmitting} className={`flex-1 font-bold py-2.5 rounded-lg text-white transition ${isSubmitting ? 'bg-gray-400' : editId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {isSubmitting ? 'Menyimpan...' : editId ? 'Update Data Penerima' : '+ Simpan Penerima Baru'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- TABEL DAFTAR PENERIMA --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nama Lembaga / Penerima</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Alamat</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Target Porsi (B/K)</th>
                {isAuthorized && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={isAuthorized ? "4" : "3"} className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : penerimaList.length === 0 ? (
                <tr><td colSpan={isAuthorized ? "4" : "3"} className="p-8 text-center text-gray-500">Belum ada data penerima manfaat.</td></tr>
              ) : (
                penerimaList.map((p) => (
                  <tr key={p.id_penerima} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{p.nama_penerima}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.alamat || '-'}</td>
                    <td className="px-6 py-4 text-sm text-center font-bold">
                      <span className="text-blue-600">{p.qty_porsi_besar || 0}</span> / <span className="text-orange-500">{p.qty_porsi_kecil || 0}</span>
                    </td>
                    {isAuthorized && (
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                        <button onClick={() => handleEditClick(p)} className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 px-3 py-1 rounded-md transition">Edit</button>
                        <button onClick={() => handleHapus(p.id_penerima)} className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded-md transition">Hapus</button>
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

export default Penerima;