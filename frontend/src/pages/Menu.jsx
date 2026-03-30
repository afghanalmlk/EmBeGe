import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Layout from '../components/Layout';

const Menu = () => {
  const [menus, setMenus] = useState([]);
  const [penerimaList, setPenerimaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // --- STATE FORM MENU ---
  const [namaMenu, setNamaMenu] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [idPenerima, setIdPenerima] = useState('');
  const [qtyBesar, setQtyBesar] = useState('');
  const [qtyKecil, setQtyKecil] = useState('');
  const [bahanInput, setBahanInput] = useState('');
  const [bahanBahan, setBahanBahan] = useState([]);

  // --- STATE MODAL GIZI ---
  const [selectedMenu, setSelectedMenu] = useState(null); // Menyimpan menu yang sedang dibuka gizinya
  const [giziList, setGiziList] = useState([]);
  const [isGiziLoading, setIsGiziLoading] = useState(false);
  const [giziFormData, setGiziFormData] = useState({
    jenis_porsi: 'Besar', energi: '', protein: '', lemak: '', karbo: '', serat: ''
  });

  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const isAuthorizedMenu = role === '1' || role === '2' || role === '3';
  const isAuthorizedGizi = role !== '4'; // Akuntan (4) hanya Read-Only

  // --- FUNGSI FETCH UTAMA ---
  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [resMenu, resPenerima] = await Promise.all([
        api.get('/menu'),
        api.get('/penerima')
      ]);
      setMenus(resMenu.data.data || []);
      setPenerimaList(resPenerima.data.data || []);
    } catch (err) {
      setError('Gagal memuat data dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLER MENU ---
  const tambahBahan = () => {
    if (bahanInput.trim() !== '') {
      setBahanBahan([...bahanBahan, bahanInput.trim()]);
      setBahanInput('');
    }
  };

  const handleTambahMenu = async (e) => {
    e.preventDefault();
    if (bahanBahan.length === 0) return alert("Masukkan minimal 1 bahan baku!");
    setIsSubmitting(true);
    try {
      await api.post('/menu', {
        nama_menu: namaMenu, tanggal, id_penerima: parseInt(idPenerima),
        qty_porsi_besar: parseInt(qtyBesar) || 0, qty_porsi_kecil: parseInt(qtyKecil) || 0,
        bahan_bahan: bahanBahan
      });
      setNamaMenu(''); setTanggal(''); setIdPenerima('');
      setQtyBesar(''); setQtyKecil(''); setBahanBahan([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.pesan || 'Terjadi kesalahan saat menyimpan menu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHapusMenu = async (id_menu) => {
    if (!window.confirm('Hapus jadwal menu ini beserta gizi dan detailnya?')) return;
    try {
      await api.delete(`/menu/${id_menu}`);
      setMenus(menus.filter(m => m.id_menu !== id_menu));
    } catch (err) {
      alert(err.response?.data?.pesan || 'Gagal menghapus menu.');
    }
  };

  // --- HANDLER GIZI ---
  const openGiziModal = async (menu) => {
    setSelectedMenu(menu);
    setIsGiziLoading(true);
    try {
      const res = await api.get('/gizi');
      // Filter gizi agar hanya menampilkan milik menu yang diklik
      const filteredGizi = res.data.data.filter(g => g.id_menu === menu.id_menu);
      setGiziList(filteredGizi);
    } catch (err) {
      alert('Gagal mengambil data gizi.');
    } finally {
      setIsGiziLoading(false);
    }
  };

  const handleTambahGizi = async (e) => {
    e.preventDefault();
    try {
      await api.post('/gizi', { ...giziFormData, id_menu: selectedMenu.id_menu });
      alert('Data Gizi berhasil ditambahkan!');
      setGiziFormData({ jenis_porsi: 'Besar', energi: '', protein: '', lemak: '', karbo: '', serat: '' });
      openGiziModal(selectedMenu); // Refresh data gizi di modal
    } catch (err) {
      alert(err.response?.data?.pesan || 'Gagal menyimpan gizi.');
    }
  };

  const handleHapusGizi = async (id_gizi) => {
    if (!window.confirm('Hapus data gizi ini?')) return;
    try {
      await api.delete(`/gizi/${id_gizi}`);
      setGiziList(giziList.filter(g => g.id_gizi !== id_gizi));
    } catch (err) {
      alert('Gagal menghapus gizi.');
    }
  };

  return (
    <Layout title="Manajemen Jadwal & Menu">
      <div className="space-y-6 relative">
        
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">{error}</div>}

        {/* --- FORM TAMBAH MENU --- */}
        {isAuthorizedMenu && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-blue-900 mb-5">Jadwalkan Menu Baru</h3>
            <form onSubmit={handleTambahMenu} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nama Menu</label>
                  <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={namaMenu} onChange={(e) => setNamaMenu(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Tanggal Distribusi</label>
                  <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Penerima Manfaat</label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={idPenerima} onChange={(e) => setIdPenerima(e.target.value)} required>
                    <option value="" disabled>-- Pilih Penerima --</option>
                    {penerimaList.map(p => <option key={p.id_penerima} value={p.id_penerima}>{p.nama_penerima}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Porsi Besar</label>
                  <input type="number" min="0" className="w-full p-2 border rounded-lg" value={qtyBesar} onChange={(e) => setQtyBesar(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Porsi Kecil</label>
                  <input type="number" min="0" className="w-full p-2 border rounded-lg" value={qtyKecil} onChange={(e) => setQtyKecil(e.target.value)} required />
                </div>
              </div>

              {/* INPUT BAHAN BAKU */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-semibold text-blue-800 mb-2">Bahan Baku (Resep)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="Contoh: Beras" className="flex-1 p-2 border rounded-md outline-none"
                    value={bahanInput} onChange={(e) => setBahanInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tambahBahan())}
                  />
                  <button type="button" onClick={tambahBahan} className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold hover:bg-blue-700">Tambah</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {bahanBahan.map((bahan, idx) => (
                    <span key={idx} className="bg-white border border-blue-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      {bahan} <button type="button" onClick={() => hapusBahan(idx)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting} className={`font-bold py-2 px-8 rounded-lg text-white ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- TABEL DAFTAR MENU --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Tgl Jadwal</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Nama Menu</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Penerima</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase">Porsi (B/K)</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Memuat...</td></tr>
              ) : menus.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada jadwal.</td></tr>
              ) : (
                menus.map((menu) => (
                  <tr key={menu.id_menu} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                      {new Date(menu.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-blue-900">{menu.nama_menu}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{menu.nama_penerima || '-'}</td>
                    <td className="px-6 py-4 text-sm text-center font-bold">
                      <span className="text-blue-600">{menu.qty_porsi_besar || 0}</span> / <span className="text-orange-500">{menu.qty_porsi_kecil || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <button onClick={() => openGiziModal(menu)} className="text-green-600 hover:text-green-800 bg-green-50 px-3 py-1 rounded-md">
                        Detail Gizi
                      </button>
                      {isAuthorizedMenu && (
                        <button onClick={() => handleHapusMenu(menu.id_menu)} className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded-md">
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL GIZI (MUNCUL KETIKA KLIK DETAIL GIZI) */}
        {selectedMenu && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              
              {/* Header Modal */}
              <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-xl font-black text-blue-900">Kandungan Gizi</h3>
                  <p className="text-sm font-medium text-gray-500 mt-1">Menu: {selectedMenu.nama_menu}</p>
                </div>
                <button onClick={() => setSelectedMenu(null)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>
              </div>

              <div className="p-6 space-y-6">
                {/* Form Tambah Gizi (Disembunyikan untuk Akuntan) */}
                {isAuthorizedGizi && (
                  <form onSubmit={handleTambahGizi} className="bg-green-50 p-5 rounded-xl border border-green-100">
                    <h4 className="font-bold text-green-800 mb-3 text-sm uppercase">Input Nilai Gizi Baru</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <select className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" value={giziFormData.jenis_porsi} onChange={(e) => setGiziFormData({...giziFormData, jenis_porsi: e.target.value})}>
                        <option value="Besar">Porsi Besar</option>
                        <option value="Kecil">Porsi Kecil</option>
                      </select>
                      <input type="number" step="0.1" placeholder="Energi (kkal)" className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" value={giziFormData.energi} onChange={(e) => setGiziFormData({...giziFormData, energi: e.target.value})} required />
                      <input type="number" step="0.1" placeholder="Protein (g)" className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" value={giziFormData.protein} onChange={(e) => setGiziFormData({...giziFormData, protein: e.target.value})} required />
                      <input type="number" step="0.1" placeholder="Lemak (g)" className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" value={giziFormData.lemak} onChange={(e) => setGiziFormData({...giziFormData, lemak: e.target.value})} required />
                      <input type="number" step="0.1" placeholder="Karbo (g)" className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" value={giziFormData.karbo} onChange={(e) => setGiziFormData({...giziFormData, karbo: e.target.value})} required />
                      <input type="number" step="0.1" placeholder="Serat (g)" className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-green-500" value={giziFormData.serat} onChange={(e) => setGiziFormData({...giziFormData, serat: e.target.value})} required />
                    </div>
                    <button type="submit" className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition shadow-sm">
                      + Simpan Data Gizi
                    </button>
                  </form>
                )}

                {/* Tabel Data Gizi */}
                <div className="border rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Porsi</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Energi</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Protein</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Lemak</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Karbo</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Serat</th>
                        {isAuthorizedGizi && <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {isGiziLoading ? (
                        <tr><td colSpan="7" className="text-center p-6 text-gray-500">Memuat data gizi...</td></tr>
                      ) : giziList.length === 0 ? (
                        <tr><td colSpan="7" className="text-center p-6 text-gray-500 italic">Belum ada data gizi yang diinput untuk menu ini.</td></tr>
                      ) : (
                        giziList.map((g) => (
                          <tr key={g.id_gizi} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-bold text-blue-800">{g.jenis_porsi}</td>
                            <td className="px-4 py-3 text-sm text-center">{g.energi}</td>
                            <td className="px-4 py-3 text-sm text-center">{g.protein}</td>
                            <td className="px-4 py-3 text-sm text-center">{g.lemak}</td>
                            <td className="px-4 py-3 text-sm text-center">{g.karbo}</td>
                            <td className="px-4 py-3 text-sm text-center">{g.serat}</td>
                            {isAuthorizedGizi && (
                              <td className="px-4 py-3 text-sm text-right">
                                <button onClick={() => handleHapusGizi(g.id_gizi)} className="text-red-500 font-bold hover:underline">Hapus</button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Menu;