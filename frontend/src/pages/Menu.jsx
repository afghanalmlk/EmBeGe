import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import Layout from '../components/Layout';

const Menu = () => {
  const [activeTab, setActiveTab] = useState('master');
  const [masterMenus, setMasterMenus] = useState([]);
  const [jadwalMenus, setJadwalMenus] = useState([]);
  const [penerimaList, setPenerimaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Identifikasi Role UI
  const roleId = parseInt(localStorage.getItem('role'));
  const isSuperadmin = roleId === 1;
  const isKaSPPG = roleId === 2;
  const isAhliGizi = roleId === 3;
  const isAkuntan = roleId === 4;

  const canCreate = isSuperadmin || isKaSPPG || isAhliGizi;
  const canReview = isSuperadmin || isKaSPPG || isAkuntan;
  const canApprove = isSuperadmin || isKaSPPG;

  // --- STATE FORM MASTER MENU ---
  const [namaMenu, setNamaMenu] = useState('');
  const [bahanInput, setBahanInput] = useState('');
  const [bahanBahan, setBahanBahan] = useState([]);

  // --- STATE FORM JADWAL MENU ---
  const [jadwalIdMenu, setJadwalIdMenu] = useState('');
  const [jadwalTanggal, setJadwalTanggal] = useState('');
  const [selectedPenerima, setSelectedPenerima] = useState({}); // { id: { porsi_besar, porsi_kecil } }

  // --- MODALS ---
  const [menuToReview, setMenuToReview] = useState(null); // Untuk Modal Akuntan
  const [reviewCatatan, setReviewCatatan] = useState('');
  const [reviewChecklist, setReviewChecklist] = useState({});

  const [selectedGiziMenu, setSelectedGiziMenu] = useState(null); // Untuk Modal Gizi
  const [giziList, setGiziList] = useState([]);
  const [giziFormData, setGiziFormData] = useState({ jenis_porsi: 'Besar', energi: '', protein: '', lemak: '', karbo: '', serat: '' });

  const fetchData = async () => {
    setIsLoading(true); setError('');
    try {
      const [resMaster, resJadwal, resPenerima] = await Promise.all([
        api.get('/menu/master'), api.get('/menu/jadwal'), api.get('/penerima')
      ]);
      setMasterMenus(resMaster.data.data || []);
      setJadwalMenus(resJadwal.data.data || []);
      setPenerimaList(resPenerima.data.data || []);
    } catch (err) { setError('Gagal memuat data.'); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ================= 1. HANDLER MASTER MENU =================
  const handleTambahMaster = async (e) => {
    e.preventDefault();
    if (bahanBahan.length === 0) return alert("Masukkan minimal 1 bahan baku!");
    try {
      await api.post('/menu/master', { nama_menu: namaMenu, bahan_bahan: bahanBahan });
      setNamaMenu(''); setBahanBahan([]); fetchData();
    } catch (err) { alert(err.response?.data?.pesan); }
  };

  const submitReviewAkuntan = async (e) => {
    e.preventDefault();
    // Jika semua bahan dicentang = True, jika ada 1 yg tidak dicentang = Revisi
    const isApprovedSemua = menuToReview.bahan_bahan.every(b => reviewChecklist[b.id_detail_menu]);
    const payloadChecklist = menuToReview.bahan_bahan.map(b => ({
      id_detail_menu: b.id_detail_menu,
      is_approved: !!reviewChecklist[b.id_detail_menu]
    }));

    try {
      await api.patch(`/menu/master/${menuToReview.id_menu}/review`, {
        is_approved_semua: isApprovedSemua, catatan: reviewCatatan, bahan_checklist: payloadChecklist
      });
      setMenuToReview(null); fetchData();
    } catch (err) { alert(err.response?.data?.pesan); }
  };

  const handleApproveKaSPPG = async (id_menu) => {
    if (!window.confirm("Approve menu ini menjadi Final?")) return;
    try { await api.patch(`/menu/master/${id_menu}/approve`); fetchData(); } 
    catch (err) { alert(err.response?.data?.pesan); }
  };

  const handleHapusMaster = async (id) => {
    if (!window.confirm('Hapus Master Menu ini?')) return;
    try { await api.delete(`/menu/master/${id}`); fetchData(); } catch (err) {}
  };

  // ================= 2. HANDLER JADWAL MENU =================
  const handleTogglePenerima = (p) => {
    setSelectedPenerima(prev => {
      const next = { ...prev };
      if (next[p.id_penerima]) {
        delete next[p.id_penerima]; // Uncheck
      } else {
        // Ambil default dari tabel data penerima manfaat
        next[p.id_penerima] = { porsi_besar: p.qty_porsi_besar || 0, porsi_kecil: p.qty_porsi_kecil || 0 }; 
      }
      return next;
    });
  };

  const handleTambahJadwal = async (e) => {
    e.preventDefault();
    const list_penerima = Object.keys(selectedPenerima).map(id => ({
      id_penerima: id, ...selectedPenerima[id]
    }));

    if (list_penerima.length === 0) return alert("Centang minimal 1 Penerima Manfaat!");
    try {
      await api.post('/menu/jadwal', { id_menu: jadwalIdMenu, tanggal: jadwalTanggal, list_penerima });
      setJadwalIdMenu(''); setJadwalTanggal(''); setSelectedPenerima({}); fetchData();
    } catch (err) { alert(err.response?.data?.pesan); }
  };

  const handleHapusJadwal = async (id) => {
    if (!window.confirm('Hapus jadwal ini?')) return;
    try { await api.delete(`/menu/jadwal/${id}`); fetchData(); } catch (err) {}
  };

  // ================= 3. HANDLER GIZI =================
  const openGiziModal = async (menu) => {
    setSelectedGiziMenu(menu);
    try {
      const res = await api.get('/gizi');
      setGiziList(res.data.data.filter(g => g.id_menu === menu.id_menu));
    } catch (err) { alert('Gagal load gizi.'); }
  };
  const handleTambahGizi = async (e) => {
    e.preventDefault();
    try {
      await api.post('/gizi', { ...giziFormData, id_menu: selectedGiziMenu.id_menu });
      setGiziFormData({ jenis_porsi: 'Besar', energi: '', protein: '', lemak: '', karbo: '', serat: '' });
      openGiziModal(selectedGiziMenu); 
    } catch (err) { alert(err.response?.data?.pesan); }
  };
  const handleHapusGizi = async (id) => {
    if (!window.confirm('Hapus?')) return;
    try { await api.delete(`/gizi/${id}`); openGiziModal(selectedGiziMenu); } catch (err) {}
  };

  return (
    <Layout title="Manajemen Menu & Jadwal">
      <div className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border">{error}</div>}

        {/* TABS */}
        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('master')} className={`px-6 py-3 font-bold border-b-2 ${activeTab === 'master' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            Master Menu (Resep)
          </button>
          <button onClick={() => setActiveTab('jadwal')} className={`px-6 py-3 font-bold border-b-2 ${activeTab === 'jadwal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            Jadwal Menu Hari Ini
          </button>
        </div>

        {/* ================= TAB 1: MASTER MENU ================= */}
        {activeTab === 'master' && (
          <div className="space-y-6">
            {canCreate && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-blue-900">Buat Menu Baru</h3>
                <form onSubmit={handleTambahMaster} className="space-y-4">
                  <input type="text" placeholder="Nama Menu (Contoh: Nasi Goreng Spesial)" className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500" value={namaMenu} onChange={(e) => setNamaMenu(e.target.value)} required />
                  
                  <div className="bg-blue-50 p-4 rounded border border-blue-100">
                    <label className="block text-sm font-bold mb-2 text-blue-800">Bahan Baku</label>
                    <div className="flex gap-2 mb-3">
                      <input type="text" placeholder="Ketik nama bahan lalu tekan Add/Enter..." className="flex-1 p-2 border rounded outline-none" value={bahanInput} onChange={(e) => setBahanInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), bahanInput && setBahanBahan([...bahanBahan, bahanInput.trim()], setBahanInput('')))} />
                      <button type="button" onClick={() => bahanInput && setBahanBahan([...bahanBahan, bahanInput.trim()], setBahanInput(''))} className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700">Add Bahan</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bahanBahan.map((b, i) => (
                        <span key={i} className="bg-white border px-3 py-1 rounded-full text-sm shadow-sm">{b} <button type="button" onClick={() => setBahanBahan(bahanBahan.filter((_, idx) => idx !== i))} className="text-red-500 ml-2 font-bold">&times;</button></span>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700">Simpan Draft & Ajukan ke Akuntan</button>
                </form>
              </div>
            )}
            
            {/* Tabel Master Menu */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nama Menu</th><th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th><th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? <tr><td colSpan="3" className="text-center p-6 text-gray-500">Memuat...</td></tr> : 
                   masterMenus.map(m => (
                    <tr key={m.id_menu} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-blue-900">{m.nama_menu}</p>
                        <p className="text-xs text-gray-500">Dibuat: {m.pembuat}</p>
                        {m.catatan_akuntan && <p className="text-xs text-red-500 mt-1">Catatan: {m.catatan_akuntan}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          m.status_menu === 'Disetujui' ? 'bg-green-100 text-green-700' : 
                          m.status_menu === 'Disetujui Akuntan' ? 'bg-blue-100 text-blue-700' : 
                          m.status_menu === 'Revisi' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{m.status_menu}</span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {canReview && m.status_menu === 'Pending Akuntan' && (
                          <button onClick={() => {
                            setMenuToReview(m);
                            // Inisialisasi state checklist sesuai data DB
                            const initialCheck = {};
                            m.bahan_bahan.forEach(b => initialCheck[b.id_detail_menu] = b.is_approved_akuntan);
                            setReviewChecklist(initialCheck);
                            setReviewCatatan('');
                          }} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded font-bold text-sm">Review (Akuntan)</button>
                        )}
                        {canApprove && m.status_menu === 'Disetujui Akuntan' && (
                          <button onClick={() => handleApproveKaSPPG(m.id_menu)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-bold text-sm">Approve (KaSPPG)</button>
                        )}
                        {canCreate && <button onClick={() => handleHapusMaster(m.id_menu)} className="text-red-500 font-bold hover:underline text-sm">Hapus</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL REVIEW AKUNTAN */}
        {menuToReview && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg">Review Bahan: {menuToReview.nama_menu}</h3>
                <button onClick={() => setMenuToReview(null)} className="text-xl font-bold text-gray-500 hover:text-red-500">&times;</button>
              </div>
              <form onSubmit={submitReviewAkuntan} className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-2">Centang bahan yang <b>disetujui</b>:</p>
                <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2 bg-gray-50">
                  {menuToReview.bahan_bahan.map(b => (
                    <label key={b.id_detail_menu} className="flex items-center gap-3 bg-white p-2 border rounded cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 text-blue-600" 
                        checked={!!reviewChecklist[b.id_detail_menu]}
                        onChange={(e) => setReviewChecklist({...reviewChecklist, [b.id_detail_menu]: e.target.checked})} 
                      />
                      <span className="font-medium text-gray-800">{b.nama_barang}</span>
                    </label>
                  ))}
                </div>
                <textarea placeholder="Catatan (Opsional, wajib diisi jika ada bahan yang ditolak/revisi)" className="w-full p-2 border rounded text-sm" value={reviewCatatan} onChange={(e) => setReviewCatatan(e.target.value)} rows="3"></textarea>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">Simpan Review</button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 2: JADWAL MENU HARI INI ================= */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6">
            {canCreate && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-blue-900">Jadwalkan & Distribusikan Menu</h3>
                <form onSubmit={handleTambahJadwal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Pilih Menu (Telah Disetujui)</label>
                      <select className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500" value={jadwalIdMenu} onChange={(e) => setJadwalIdMenu(e.target.value)} required>
                        <option value="">-- Pilih Menu --</option>
                        {masterMenus.filter(m => m.status_menu === 'Disetujui').map(m => <option key={m.id_menu} value={m.id_menu}>{m.nama_menu}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Tanggal Distribusi</label>
                      <input type="date" className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500" value={jadwalTanggal} onChange={(e) => setJadwalTanggal(e.target.value)} required />
                    </div>
                  </div>
                  
                  <div className="border border-blue-100 p-4 rounded-lg bg-blue-50 max-h-80 overflow-y-auto">
                    <label className="font-bold block mb-3 text-blue-900">Pilih Penerima Manfaat</label>
                    {penerimaList.map(p => (
                      <div key={p.id_penerima} className={`flex flex-col md:flex-row md:items-center justify-between p-3 bg-white mb-2 border rounded transition-all ${selectedPenerima[p.id_penerima] ? 'border-blue-400 shadow-sm' : 'border-gray-200'}`}>
                        <label className="flex items-center gap-3 cursor-pointer font-medium mb-2 md:mb-0">
                          <input type="checkbox" className="w-5 h-5 text-blue-600" checked={!!selectedPenerima[p.id_penerima]} onChange={() => handleTogglePenerima(p)} /> 
                          {p.nama_penerima}
                        </label>
                        {/* Munculkan form input QTY B/K jika dicentang */}
                        {selectedPenerima[p.id_penerima] && (
                          <div className="flex gap-4 items-center bg-gray-50 px-3 py-2 rounded-md">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              B: <input type="number" min="0" className="w-16 p-1 border rounded text-center outline-none focus:ring-2 focus:ring-blue-500" value={selectedPenerima[p.id_penerima].porsi_besar} onChange={(e) => setSelectedPenerima({...selectedPenerima, [p.id_penerima]: {...selectedPenerima[p.id_penerima], porsi_besar: parseInt(e.target.value) || 0}})} />
                            </label>
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              K: <input type="number" min="0" className="w-16 p-1 border rounded text-center outline-none focus:ring-2 focus:ring-blue-500" value={selectedPenerima[p.id_penerima].porsi_kecil} onChange={(e) => setSelectedPenerima({...selectedPenerima, [p.id_penerima]: {...selectedPenerima[p.id_penerima], porsi_kecil: parseInt(e.target.value) || 0}})} />
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="w-full md:w-auto bg-blue-600 text-white font-bold py-2 px-8 rounded hover:bg-blue-700">Simpan Jadwal</button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-100"><tr><th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Tanggal</th><th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Menu</th><th className="p-4 text-left text-xs font-bold uppercase text-gray-500">Penerima</th><th className="p-4 text-center text-xs font-bold uppercase text-gray-500">Porsi (B/K)</th><th className="p-4 text-right text-xs font-bold uppercase text-gray-500">Aksi</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? <tr><td colSpan="5" className="p-8 text-center text-gray-500">Memuat...</td></tr> : 
                   jadwalMenus.map(j => (
                    <tr key={j.id_jadwal} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{new Date(j.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 font-bold text-blue-900">{j.nama_menu}</td>
                      <td className="p-4">{j.nama_penerima}</td>
                      <td className="p-4 text-center font-bold text-gray-700">{j.qty_porsi_besar} / {j.qty_porsi_kecil}</td>
                      <td className="p-4 text-right space-x-3">
                        <button onClick={() => openGiziModal(j)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded font-bold transition">Isi / Lihat Gizi</button>
                        {canCreate && <button onClick={() => handleHapusJadwal(j.id_jadwal)} className="text-red-500 font-bold hover:underline">Hapus</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL GIZI */}
        {selectedGiziMenu && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg">Kandungan Gizi: {selectedGiziMenu.nama_menu}</h3>
                <button onClick={() => setSelectedGiziMenu(null)} className="text-2xl font-bold text-gray-400 hover:text-red-500">&times;</button>
              </div>
              <div className="p-4 space-y-4">
                {!isAkuntan && (
                  <form onSubmit={handleTambahGizi} className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-green-50 p-4 rounded-lg border border-green-100">
                    <select className="p-2 border rounded outline-none focus:ring-2 focus:ring-green-500" value={giziFormData.jenis_porsi} onChange={(e) => setGiziFormData({...giziFormData, jenis_porsi: e.target.value})}>
                      <option value="Besar">Porsi Besar</option><option value="Kecil">Porsi Kecil</option>
                    </select>
                    <input type="number" step="0.1" placeholder="Energi (kkal)" className="p-2 border rounded outline-none" value={giziFormData.energi} onChange={(e) => setGiziFormData({...giziFormData, energi: e.target.value})} required/>
                    <input type="number" step="0.1" placeholder="Protein (g)" className="p-2 border rounded outline-none" value={giziFormData.protein} onChange={(e) => setGiziFormData({...giziFormData, protein: e.target.value})} required/>
                    <input type="number" step="0.1" placeholder="Lemak (g)" className="p-2 border rounded outline-none" value={giziFormData.lemak} onChange={(e) => setGiziFormData({...giziFormData, lemak: e.target.value})} required/>
                    <input type="number" step="0.1" placeholder="Karbo (g)" className="p-2 border rounded outline-none" value={giziFormData.karbo} onChange={(e) => setGiziFormData({...giziFormData, karbo: e.target.value})} required/>
                    <input type="number" step="0.1" placeholder="Serat (g)" className="p-2 border rounded outline-none" value={giziFormData.serat} onChange={(e) => setGiziFormData({...giziFormData, serat: e.target.value})} required/>
                    <button type="submit" className="col-span-full md:col-span-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition">+ Simpan Data Gizi</button>
                  </form>
                )}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-100"><tr><th className="p-3 text-left">Porsi</th><th className="p-3 text-center">Energi</th><th className="p-3 text-center">Protein</th><th className="p-3 text-center">Lemak</th><th className="p-3 text-center">Karbo</th><th className="p-3 text-center">Serat</th>{!isAkuntan&&<th className="p-3 text-center">Aksi</th>}</tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {giziList.length === 0 ? <tr><td colSpan="7" className="p-4 text-center text-gray-500 italic">Belum ada data.</td></tr> :
                      giziList.map(g => <tr key={g.id_gizi} className="hover:bg-gray-50"><td className="p-3 font-bold">{g.jenis_porsi}</td><td className="p-3 text-center">{g.energi}</td><td className="p-3 text-center">{g.protein}</td><td className="p-3 text-center">{g.lemak}</td><td className="p-3 text-center">{g.karbo}</td><td className="p-3 text-center">{g.serat}</td>{!isAkuntan&&<td className="p-3 text-center"><button onClick={() => handleHapusGizi(g.id_gizi)} className="text-red-500 font-bold hover:underline">Hapus</button></td>}</tr>)}
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