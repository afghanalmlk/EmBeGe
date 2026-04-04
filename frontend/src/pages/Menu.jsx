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

  // Aturan Akses Sesuai Blueprint Final
  const canCreate = isSuperadmin || isKaSPPG || isAhliGizi; // Ahli Gizi & KaSPPG bisa buat/revisi
  const canReview = isSuperadmin || isAkuntan;  // Akuntan mereview bahan (checklist)
  const canApprove = isSuperadmin || isKaSPPG; // KaSPPG approval (Setujui/Tolak)
  const canDelete = isSuperadmin || isKaSPPG; // Hanya KaSPPG yg boleh hapus

  // --- STATE FORM MASTER MENU ---
  const [namaMenu, setNamaMenu] = useState('');
  const [bahanInput, setBahanInput] = useState('');
  const [bahanBahan, setBahanBahan] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // --- STATE FORM JADWAL MENU ---
  const [jadwalIdMenu, setJadwalIdMenu] = useState('');
  const [jadwalTanggal, setJadwalTanggal] = useState('');
  const [selectedPenerima, setSelectedPenerima] = useState({});

  // --- MODALS DETAIL & REVIEW ---
  const [detailModal, setDetailModal] = useState(null);
  const [reviewCatatan, setReviewCatatan] = useState('');
  const [reviewChecklist, setReviewChecklist] = useState({});

  // --- STATE GIZI ---
  const [selectedGiziMenu, setSelectedGiziMenu] = useState(null);
  const [giziList, setGiziList] = useState([]);
  const [giziFormData, setGiziFormData] = useState({ jenis_porsi: 'Besar', energi: '', protein: '', lemak: '', karbo: '', serat: '' });

  // PARSER ANTI-BLANK (Mengurai string JSON dari DB ke Array)
  const parseData = (data) => {
      if (typeof data === 'string') {
          try { return JSON.parse(data); } catch { return []; }
      }
      return Array.isArray(data) ? data : [];
  };

  const fetchData = async () => {
    setIsLoading(true); setError('');
    try {
      const [resMaster, resJadwal, resPenerima] = await Promise.all([
        api.get('/menu/master'), api.get('/menu/jadwal'), api.get('/penerima')
      ]);
      
      const safeMasterMenus = (resMaster.data.data || []).map(m => ({
          ...m,
          bahan_bahan: parseData(m.bahan_bahan || m.daftar_bahan), 
          histori: parseData(m.histori)
      }));

      setMasterMenus(safeMasterMenus);
      setJadwalMenus(resJadwal.data.data || []);
      setPenerimaList(resPenerima.data.data || []);
    } catch (err) { setError('Gagal memuat data.'); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const formatDateTime = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : '-';

  // ================= HANDLERS MASTER MENU =================
  const handleTambahBahan = () => {
      if (bahanInput.trim()) {
          setBahanBahan([...bahanBahan, bahanInput.trim()]);
          setBahanInput('');
      }
  };

  const handleSubmitMaster = async (e) => {
    e.preventDefault();
    if (bahanBahan.length === 0) return alert("Masukkan minimal 1 bahan baku!");
    try {
      if (isEditMode) {
        await api.patch(`/menu/master/${editId}`, { nama_menu: namaMenu, bahan_bahan: bahanBahan });
        alert("Revisi menu berhasil diajukan ulang!");
        setIsEditMode(false); setEditId(null);
      } else {
        await api.post('/menu/master', { nama_menu: namaMenu, bahan_bahan: bahanBahan });
        alert("Resep menu baru berhasil diajukan!");
      }
      setNamaMenu(''); setBahanBahan([]); fetchData();
    } catch (err) { alert(err.response?.data?.pesan || "Terjadi kesalahan."); }
  };

  const handleBatalEdit = () => {
      setIsEditMode(false); setEditId(null); setNamaMenu(''); setBahanBahan([]);
  };

  const triggerEdit = (m) => {
      const bahanArray = parseData(m.bahan_bahan || m.daftar_bahan);
      setIsEditMode(true);
      setEditId(m.id_menu);
      setNamaMenu(m.nama_menu);
      setBahanBahan(bahanArray.map(b => b.nama_barang));
      setDetailModal(null); 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const openDetailModal = (m) => {
      const bahanArray = parseData(m.bahan_bahan || m.daftar_bahan);
      const historiArray = parseData(m.histori);
      
      setDetailModal({ ...m, bahan_bahan: bahanArray, histori: historiArray });
      
      const checks = {};
      bahanArray.forEach(b => { checks[b.id_detail_menu] = b.is_approved_akuntan ?? b.is_approved; });
      setReviewChecklist(checks);
      setReviewCatatan('');
  };

  const submitReviewAkuntan = async (e) => {
    e.preventDefault();
    const bahanArray = parseData(detailModal.bahan_bahan);
    const isApprovedSemua = bahanArray.every(b => reviewChecklist[b.id_detail_menu]);
    const payloadChecklist = bahanArray.map(b => ({
      id_detail_menu: b.id_detail_menu, is_approved: !!reviewChecklist[b.id_detail_menu]
    }));

    try {
      await api.patch(`/menu/master/${detailModal.id_menu}/review`, {
        is_approved_semua: isApprovedSemua, catatan: reviewCatatan, bahan_checklist: payloadChecklist
      });
      alert("Hasil review berhasil disimpan!");
      setDetailModal(null); fetchData();
    } catch (err) { alert(err.response?.data?.pesan || "Gagal menyimpan review."); }
  };

  // Handler Setujui KaSPPG (Sesuai Blueprint PO)
  const handleSetujuiMenu = async (id_menu) => {
    if (!window.confirm("Setujui menu ini menjadi Final?")) return;
    try { 
      // Endpoint ini asumsikan Backend sudah disesuaikan menggunakan updateStatusMenu (PATCH /status)
      await api.patch(`/menu/master/${id_menu}/status`, { status_menu: 'Disetujui' }); 
      fetchData(); 
    } catch (err) { 
      // Fallback ke endpoint lama jika backend belum sempat diubah
      try { await api.patch(`/menu/master/${id_menu}/approve`); fetchData(); } catch(e) { alert(e.response?.data?.pesan); }
    }
  };

  // Handler Tolak KaSPPG
  const handleTolakMenu = async (id_menu) => {
    const alasan = window.prompt('Masukkan catatan/alasan penolakan Menu:');
    if (alasan === null) return; 
    try { 
      await api.patch(`/menu/master/${id_menu}/status`, { status_menu: 'Ditolak', catatan: alasan }); 
      fetchData(); 
    } catch (err) { alert(err.response?.data?.pesan || "Gagal menolak menu"); }
  };

  const handleHapusMaster = async (id) => {
    if (!window.confirm('Hapus permanen Master Menu ini?')) return;
    try { await api.delete(`/menu/master/${id}`); setDetailModal(null); fetchData(); } catch (err) {}
  };

  // ================= HANDLERS JADWAL & GIZI =================
  const handleTogglePenerima = (p) => {
    setSelectedPenerima(prev => {
      const next = { ...prev };
      if (next[p.id_penerima]) { delete next[p.id_penerima]; } 
      else { next[p.id_penerima] = { porsi_besar: p.qty_porsi_besar || 0, porsi_kecil: p.qty_porsi_kecil || 0 }; }
      return next;
    });
  };

  const handleTambahJadwal = async (e) => {
    e.preventDefault();
    const list_penerima = Object.keys(selectedPenerima).map(id => ({ id_penerima: id, ...selectedPenerima[id] }));
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

  // ================= UI RENDER =================
  return (
    <Layout title="Manajemen Menu">
      <div className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border">{error}</div>}

        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('master')} className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'master' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Master Menu (Resep)</button>
          <button onClick={() => setActiveTab('jadwal')} className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'jadwal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Jadwal Menu Hari Ini</button>
        </div>

        {activeTab === 'master' && (
          <div className="space-y-6">
            
            {/* FORM INPUT MASTER MENU */}
            {canCreate && (
              <div className={`p-6 rounded-xl border shadow-sm transition ${isEditMode ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isEditMode ? 'text-orange-900' : 'text-blue-900'}`}>
                    {isEditMode ? `Revisi / Perbaiki Resep Menu #${editId}` : 'Buat Resep Menu Baru'}
                </h3>
                <form onSubmit={handleSubmitMaster} className="space-y-4">
                  <input type="text" placeholder="Nama Menu Utama (Contoh: Nasi Goreng Spesial)" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={namaMenu} onChange={(e) => setNamaMenu(e.target.value)} required />
                  
                  <div className={`${isEditMode ? 'bg-white border-orange-100' : 'bg-blue-50 border-blue-100'} p-4 rounded-xl border`}>
                    <label className={`block text-sm font-bold mb-2 ${isEditMode ? 'text-orange-800' : 'text-blue-800'}`}>Daftar Bahan Baku</label>
                    <div className="flex gap-2 mb-3">
                      <input type="text" placeholder="Ketik nama bahan baku lalu tekan Add/Enter..." className="flex-1 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={bahanInput} onChange={(e) => setBahanInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTambahBahan())} />
                      <button type="button" onClick={handleTambahBahan} className={`text-white px-4 rounded-lg font-bold transition ${isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bahanBahan.map((b, i) => (
                        <span key={i} className="bg-white border px-3 py-1 rounded-full text-sm shadow-sm font-medium flex items-center gap-2">
                            {b} <button type="button" onClick={() => setBahanBahan(bahanBahan.filter((_, idx) => idx !== i))} className="text-red-500 font-bold hover:scale-125 transition">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    {isEditMode && (
                        <button type="button" onClick={handleBatalEdit} className="font-bold py-3 px-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 w-full md:w-auto transition">Batal Revisi</button>
                    )}
                    <button type="submit" disabled={bahanBahan.length === 0} className={`w-full md:w-auto text-white font-bold py-3 px-8 rounded-lg shadow-sm transition ${bahanBahan.length === 0 ? 'bg-gray-400' : isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {isEditMode ? 'Simpan Revisi & Ajukan Ulang' : 'Simpan Draft & Ajukan'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* TABEL DAFTAR MASTER MENU */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase w-1/3">Nama Menu</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase">Status & Persetujuan</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? <tr><td colSpan="3" className="text-center p-8 text-gray-500">Memuat data...</td></tr> : masterMenus.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-gray-500">Belum ada data.</td></tr> : masterMenus.map(m => (
                    <tr key={m.id_menu} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800 text-base">{m.nama_menu}</p>
                        <p className="text-xs text-gray-500 mt-1">Dibuat Oleh: <span className="font-medium text-gray-700">{m.pembuat}</span></p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                            m.status_menu === 'Disetujui' ? 'bg-green-100 text-green-800' : 
                            m.status_menu === 'Di Review Akuntan' || m.status_menu === 'Disetujui Akuntan' ? 'bg-blue-100 text-blue-800' : 
                            m.status_menu === 'Revisi' || m.status_menu === 'Perlu Revisi' || m.status_menu === 'Ditolak' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>{m.status_menu}</span>
                          
                          {/* Catatan Inline Jika Ditolak/Revisi */}
                          {m.status_menu === 'Ditolak' && m.catatan_kasppg && (
                             <p className="text-[10px] text-red-500 italic mt-1 max-w-[150px] truncate" title={m.catatan_kasppg}>Catatan: {m.catatan_kasppg}</p>
                          )}
                          {(m.status_menu === 'Perlu Revisi' || m.status_menu === 'Revisi') && m.catatan_akuntan && (
                             <p className="text-[10px] text-red-500 italic mt-1 max-w-[150px] truncate" title={m.catatan_akuntan}>Catatan: {m.catatan_akuntan}</p>
                          )}

                          {/* Aksi Inline Berdasarkan Blueprint */}
                          {(m.status_menu === 'Menunggu Di Review' || m.status_menu === 'Pending Akuntan') && canReview && (
                            <div className="flex gap-1 mt-1">
                                <button onClick={() => openDetailModal(m)} className="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] px-2 py-1 rounded shadow-sm font-bold transition">Review Bahan</button>
                            </div>
                          )}
                          
                          {(m.status_menu === 'Di Review Akuntan' || m.status_menu === 'Disetujui Akuntan') && canApprove && (
                            <div className="flex gap-1 mt-1 justify-center">
                                <button onClick={() => handleSetujuiMenu(m.id_menu)} className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-2 py-1 rounded shadow-sm transition font-bold">Setujui</button>
                                <button onClick={() => handleTolakMenu(m.id_menu)} className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow-sm transition font-bold">Tolak</button>
                            </div>
                          )}

                          {(m.status_menu === 'Revisi' || m.status_menu === 'Perlu Revisi' || m.status_menu === 'Ditolak') && canCreate && (
                             <div className="flex gap-1 mt-1 justify-center">
                                <button onClick={() => triggerEdit(m)} className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] px-3 py-1 rounded shadow-sm font-bold transition">Revisi</button>
                             </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => openDetailModal(m)} className="text-blue-600 hover:text-white border border-blue-600 hover:bg-blue-600 px-4 py-1.5 rounded-lg shadow-sm text-xs font-bold transition">Lihat Detail</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL POP UP DETAIL & REVIEW MENU */}
        {detailModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              
              {/* HEADER MODAL */}
              <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-blue-900 text-white z-10">
                <div>
                  <h3 className="text-xl font-black">{detailModal.nama_menu}</h3>
                </div>
                <button onClick={() => setDetailModal(null)} className="text-2xl font-bold text-gray-300 hover:text-red-400 transition">&times;</button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* CATATAN REVISI / PENOLAKAN */}
                {detailModal.status_menu === 'Ditolak' && detailModal.catatan_kasppg && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <p className="text-sm text-red-700 font-bold uppercase mb-1">Catatan Penolakan KaSPPG:</p>
                        <p className="text-sm text-red-800">{detailModal.catatan_kasppg}</p>
                    </div>
                )}
                {(detailModal.status_menu === 'Perlu Revisi' || detailModal.status_menu === 'Revisi') && detailModal.catatan_akuntan && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <p className="text-sm text-red-700 font-bold uppercase mb-1">Catatan Akuntan / Alasan Revisi:</p>
                        <p className="text-sm text-red-800">{detailModal.catatan_akuntan}</p>
                    </div>
                )}
                
                {/* TABEL RINCIAN BAHAN */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">Tabel Daftar Bahan</h4>
                  
                  {canReview && (detailModal.status_menu === 'Pending Akuntan' || detailModal.status_menu === 'Menunggu Di Review') ? (
                    // TAMPILAN CHECKLIST UNTUK AKUNTAN
                    <form onSubmit={submitReviewAkuntan} className="space-y-4 border border-gray-200 p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600 mb-2">Centang bahan yang <b>disetujui</b> untuk dibeli:</p>
                        <table className="min-w-full border rounded-lg overflow-hidden text-sm bg-white">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 text-left w-3/4">Nama Bahan Baku</th>
                                    <th className="px-4 py-3 text-center">Status Checklist</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {detailModal.bahan_bahan.map(b => (
                                    <tr key={b.id_detail_menu} className="hover:bg-gray-50 cursor-pointer" onClick={() => setReviewChecklist({...reviewChecklist, [b.id_detail_menu]: !reviewChecklist[b.id_detail_menu]})}>
                                        <td className="px-4 py-3 font-bold text-gray-800">{b.nama_barang}</td>
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" className="w-5 h-5 text-blue-600 cursor-pointer" 
                                                checked={!!reviewChecklist[b.id_detail_menu]}
                                                onChange={(e) => setReviewChecklist({...reviewChecklist, [b.id_detail_menu]: e.target.checked})} 
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="pt-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Catatan Review (Jika ada yang ditolak)</label>
                            <textarea placeholder="Tuliskan alasan revisi bahan..." className="w-full p-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={reviewCatatan} onChange={(e) => setReviewCatatan(e.target.value)} rows="3"></textarea>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-sm hover:bg-blue-700 transition">Simpan Hasil Review Akuntan</button>
                    </form>
                  ) : (
                    // TAMPILAN READ-ONLY TABLE (SESUAI BLUEPRINT)
                    <table className="min-w-full border rounded-lg overflow-hidden text-sm bg-white">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="px-4 py-3 text-left w-3/4">Nama Bahan Baku</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {detailModal.bahan_bahan.map(b => (
                                <tr key={b.id_detail_menu} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-bold text-gray-800">{b.nama_barang}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded ${b.is_approved_akuntan ?? b.is_approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {b.is_approved_akuntan ?? b.is_approved ? "✓ APPROVED" : "✗ REJECTED"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  )}
                </div>

                {/* TOMBOL REVISI (Jika status Revisi & Boleh Create) */}
                {(detailModal.status_menu === 'Revisi' || detailModal.status_menu === 'Perlu Revisi' || detailModal.status_menu === 'Ditolak') && canCreate && (
                    <div className="flex justify-end pt-2">
                         <button onClick={() => triggerEdit(detailModal)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-sm transition">
                             Buka Form Perbaikan Resep Menu
                         </button>
                    </div>
                )}

                {/* HISTORI DOKUMEN */}
                <div className="pt-4 border-t border-dashed border-gray-300">
                    <h4 className="font-bold text-gray-700 mb-3 text-sm">Histori Dokumen</h4>
                    <div className="space-y-2">
                        {detailModal.histori && detailModal.histori.length > 0 ? detailModal.histori.map((h, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                                    <span className="font-medium text-gray-800"><strong>{h.action}</strong> oleh <span className="text-blue-700 font-bold">{h.action_by}</span></span>
                                </div>
                                <span className="text-gray-400 font-medium">{formatDateTime(h.action_at)}</span>
                            </div>
                        )) : <p className="text-xs text-gray-500 italic">Tidak ada histori tindakan yang terekam.</p>}
                    </div>
                </div>

                {/* TOMBOL HAPUS (HANYA KaSPPG & Superadmin jika belum disetujui final) */}
                {canDelete && (
                    <div className="pt-4 border-t flex justify-end">
                         <button onClick={() => handleHapusMaster(detailModal.id_menu)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-5 py-2.5 rounded-lg text-xs font-bold border border-red-200 transition">
                            Hapus Permanen Dokumen Menu
                        </button>
                    </div>
                )}

              </div>
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
                        {canDelete && <button onClick={() => handleHapusJadwal(j.id_jadwal)} className="text-red-500 font-bold hover:underline">Hapus</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL GIZI (DIBIARKAN DEFAULT) */}
        {selectedGiziMenu && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg">Kandungan Gizi: {selectedGiziMenu.nama_menu}</h3>
                <button onClick={() => setSelectedGiziMenu(null)} className="text-2xl font-bold text-gray-400 hover:text-red-500 transition">&times;</button>
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