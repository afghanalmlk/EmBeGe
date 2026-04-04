import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import Layout from '../components/Layout';

const PO = () => {
  const [poList, setPoList] = useState([]);
  const [menuList, setMenuList] = useState([]);
  const [barangList, setBarangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [idJadwalMenu, setIdJadwalMenu] = useState('');
  const [tanggalPO, setTanggalPO] = useState(new Date().toISOString().split('T')[0]);
  
  const [cart, setCart] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState('');
  const [qtyBarang, setQtyBarang] = useState('');
  const [satuanBarang, setSatuanBarang] = useState(''); 
  const [hargaBarang, setHargaBarang] = useState('');

  const [isEditMode, setIsEditMode] = useState(false);
  const [poToEditId, setPoToEditId] = useState(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const roleId = parseInt(localStorage.getItem('role'));
  const isSuperadmin = roleId === 1;
  const isKaSPPG = roleId === 2;
  const isAkuntan = roleId === 4;

  // Aturan Akses Sesuai Blueprint
  const canCreatePO = isSuperadmin || isAkuntan;
  const canApprovePO = isSuperadmin || isKaSPPG; 

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [resPO, resMenu, resBarang] = await Promise.all([
        api.get('/po'), api.get('/menu/jadwal'), api.get('/barang')
      ]);
      setPoList(resPO.data.data || []);
      setMenuList(resMenu.data.data || []); 
      setBarangList(resBarang.data.data || []);
    } catch (err) { setError('Gagal memuat data PO atau Master Data.'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddToCart = () => {
    if (!selectedBarang || !qtyBarang || !satuanBarang || !hargaBarang) return alert('Pilih barang, masukkan kuantitas, SATUAN, dan harga!');
    const barangObj = barangList.find(b => b.id_barang === parseInt(selectedBarang));
    if (cart.findIndex(item => item.id_barang === parseInt(selectedBarang)) >= 0) return alert('Barang sudah ada di daftar.');
    
    setCart([...cart, { 
        id_barang: parseInt(selectedBarang), nama_barang: barangObj.nama_barang, 
        qty_barang: parseInt(qtyBarang), satuan: satuanBarang.trim(), 
        harga_barang: parseInt(hargaBarang), subtotal: parseInt(qtyBarang) * parseInt(hargaBarang)
    }]);

    setSelectedBarang(''); setQtyBarang(''); setSatuanBarang(''); setHargaBarang('');
  };

  const handleRemoveFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Daftar barang tidak boleh kosong!');
    if (!idJadwalMenu) return alert('Pilih jadwal menu!');
    setIsSubmitting(true);
    try {
      if (isEditMode) {
          await api.patch(`/po/${poToEditId}`, { id_jadwal_menu: parseInt(idJadwalMenu), tanggal_po: tanggalPO, daftar_barang: cart });
          alert('Purchase Order berhasil direvisi!');
          setIsEditMode(false); setPoToEditId(null);
      } else {
          await api.post('/po', { id_jadwal_menu: parseInt(idJadwalMenu), tanggal_po: tanggalPO, daftar_barang: cart });
          alert('Purchase Order berhasil diajukan!');
      }
      setIdJadwalMenu(''); setCart([]); setTanggalPO(new Date().toISOString().split('T')[0]); fetchData();
    } catch (err) { alert(err.response?.data?.pesan || 'Terjadi kesalahan.'); } 
    finally { setIsSubmitting(false); }
  };

  const triggerRevisi = (po) => {
      setIsEditMode(true);
      setPoToEditId(po.id_po);
      setTanggalPO(new Date(po.tanggal_po).toISOString().split('T')[0]);
      
      const matchedJadwal = menuList.find(m => m.nama_menu === po.nama_menu && new Date(m.tanggal).getTime() === new Date(po.tanggal_jadwal).getTime());
      if(matchedJadwal) setIdJadwalMenu(matchedJadwal.id_jadwal);
      
      setCart(po.rincian_barang.map(b => ({
          id_barang: b.id_barang, nama_barang: b.nama_barang, qty_barang: b.qty, satuan: b.satuan, harga_barang: b.harga_satuan, subtotal: b.subtotal
      })));
      setDetailModalOpen(false); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBatalEdit = () => {
      setIsEditMode(false); setPoToEditId(null); setIdJadwalMenu(''); setCart([]); setTanggalPO(new Date().toISOString().split('T')[0]);
  };

  const handleApprovePO = async (id_po) => {
    if (!window.confirm('Setujui Purchase Order ini?')) return;
    try { await api.patch(`/po/${id_po}/status`, { status_po: 'Disetujui' }); fetchData(); setDetailModalOpen(false); } catch (err) { alert(err.response?.data?.pesan); }
  };

  const handleTolakPO = async (id_po) => {
    const alasan = window.prompt('Masukkan catatan/alasan penolakan PO:');
    if (alasan === null) return; // Batal diklik
    try { await api.patch(`/po/${id_po}/status`, { status_po: 'Ditolak', catatan: alasan }); fetchData(); setDetailModalOpen(false); } catch (err) { alert(err.response?.data?.pesan); }
  };

  const openDetail = (po) => { setSelectedPO(po); setDetailModalOpen(true); };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const formatDateTime = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : '-';

  return (
    <Layout title="Purchase Order (PO)">
      <div className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">{error}</div>}

        {/* --- FORM INPUT PO (HANYA AKUNTAN & SA) --- */}
        {canCreatePO && (
          <div className={`p-6 rounded-xl shadow-sm border ${isEditMode ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-5 ${isEditMode ? 'text-orange-900' : 'text-blue-900'}`}>
                {isEditMode ? `Revisi Purchase Order #${poToEditId}` : 'Ajukan Purchase Order Baru'}
            </h3>
            <form onSubmit={handleSubmitPO} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Tanggal PO</label>
                  <input type="date" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={tanggalPO} onChange={(e) => setTanggalPO(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Untuk Jadwal Menu</label>
                  <select required className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={idJadwalMenu} onChange={(e) => setIdJadwalMenu(e.target.value)}>
                    <option value="" disabled>-- Pilih Jadwal Menu --</option>
                    {menuList.map(m => <option key={m.id_jadwal} value={m.id_jadwal}>{formatDate(m.tanggal)} - {m.nama_menu}</option>)}
                  </select>
                </div>
              </div>

              {/* KERANJANG BELANJA (CART) */}
              <div className={`${isEditMode ? 'bg-white border-orange-200' : 'bg-blue-50 border-blue-100'} p-5 rounded-xl border`}>
                <h4 className="text-sm font-bold text-gray-800 mb-3">Input Rincian Barang</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">Pilih Barang</label>
                    <select className="w-full p-2 border rounded-md bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500" value={selectedBarang} onChange={(e) => setSelectedBarang(e.target.value)}>
                      <option value="" disabled>-- Pilih Barang --</option>
                      {barangList.map(b => <option key={b.id_barang} value={b.id_barang}>{b.nama_barang}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-semibold mb-1">Qty</label><input type="number" min="1" placeholder="Jumlah" className="w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" value={qtyBarang} onChange={(e) => setQtyBarang(e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold mb-1">Satuan</label><input type="text" placeholder="Kg, Ltr" className="w-full p-2 border rounded-md text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500" value={satuanBarang} onChange={(e) => setSatuanBarang(e.target.value)} /></div>
                  <div><label className="block text-xs font-semibold mb-1">Harga Satuan (Rp)</label><input type="number" min="1" placeholder="Harga" className="w-full p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" value={hargaBarang} onChange={(e) => setHargaBarang(e.target.value)} /></div>
                </div>
                <button type="button" onClick={handleAddToCart} className={`mt-3 text-white font-bold py-2 px-4 rounded-lg text-sm w-full md:w-auto transition ${isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>+ Tambah ke Daftar</button>

                {cart.length > 0 && (
                  <div className="mt-4 bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr><th className="px-4 py-2 text-left font-bold text-gray-500">Nama Barang</th><th className="px-4 py-2 text-center font-bold text-gray-500">Qty / Satuan</th><th className="px-4 py-2 text-right font-bold text-gray-500">Harga Satuan</th><th className="px-4 py-2 text-right font-bold text-gray-500">Subtotal</th><th className="px-4 py-2 text-center font-bold text-gray-500">Aksi</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cart.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-medium">{item.nama_barang}</td>
                            <td className="px-4 py-2 text-center font-bold text-blue-700">{item.qty_barang} <span className="text-xs font-normal text-gray-500">{item.satuan}</span></td>
                            <td className="px-4 py-2 text-right">{formatRupiah(item.harga_barang)}</td>
                            <td className="px-4 py-2 text-right font-bold text-blue-800">{formatRupiah(item.subtotal)}</td>
                            <td className="px-4 py-2 text-center"><button type="button" onClick={() => handleRemoveFromCart(idx)} className="text-red-500 font-bold text-lg hover:scale-125 transition">&times;</button></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 font-bold">
                        <tr><td colSpan="3" className="px-4 py-2 text-right text-gray-800">TOTAL ESTIMASI:</td><td className="px-4 py-2 text-right text-gray-800">{formatRupiah(cart.reduce((sum, item) => sum + item.subtotal, 0))}</td><td></td></tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                 {isEditMode && (
                     <button type="button" onClick={handleBatalEdit} className="font-bold py-3 px-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 w-full md:w-auto">Batal Revisi</button>
                 )}
                 <button type="submit" disabled={isSubmitting || cart.length === 0} className={`font-bold py-3 px-8 rounded-lg text-white w-full md:w-auto transition shadow-sm ${isSubmitting || cart.length === 0 ? 'bg-gray-400' : isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                   {isSubmitting ? 'Memproses...' : isEditMode ? 'Simpan Revisi PO' : 'Ajukan Purchase Order'}
                 </button>
              </div>
            </form>
          </div>
        )}

        {/* --- TABEL DAFTAR PO --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
             <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase w-1/4">Tgl PO / No PO</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase w-1/3">Menu Referensi</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase">Status & Persetujuan</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan="4" className="p-8 text-center text-gray-500">Memuat data...</td></tr> : poList.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-gray-500">Belum ada data.</td></tr> : poList.map((po) => (
                  <tr key={po.id_po} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{formatDate(po.tanggal_po)}</p>
                        <p className="text-xs text-gray-500 mt-1">PO #{po.id_po}</p>
                    </td>
                    <td className="px-6 py-4">
                        <p className="font-bold text-blue-900">{po.nama_menu}</p>
                        <p className="text-xs text-gray-500 mt-1">Jadwal: {formatDate(po.tanggal_jadwal)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${po.status_po === 'Pending' ? 'bg-yellow-100 text-yellow-800' : po.status_po === 'Disetujui' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {po.status_po}
                        </span>
                        
                        {/* Notifikasi Catatan Penolakan di Tabel */}
                        {po.status_po === 'Ditolak' && po.catatan_kasppg && (
                           <p className="text-[10px] text-red-500 italic mt-1 max-w-[150px] truncate" title={po.catatan_kasppg}>Catatan: {po.catatan_kasppg}</p>
                        )}

                        {/* Approval KaSPPG Inline */}
                        {po.status_po === 'Pending' && canApprovePO && (
                           <div className="flex gap-1 mt-1">
                             <button onClick={() => handleApprovePO(po.id_po)} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm transition">Setujui</button>
                             <button onClick={() => handleTolakPO(po.id_po)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm transition">Tolak</button>
                           </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openDetail(po)} className="text-blue-600 hover:text-white border border-blue-600 hover:bg-blue-600 px-4 py-1.5 rounded-lg shadow-sm text-xs font-bold transition">Lihat Detail</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* --- MODAL DETAIL PO --- */}
        {detailModalOpen && selectedPO && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-blue-900 text-white z-10">
                        <div>
                            <h3 className="text-xl font-black">PO #{selectedPO.id_po}</h3>
                            <p className="text-sm font-medium text-blue-200 mt-1">Detail Purchase Order</p>
                        </div>
                        <button onClick={() => setDetailModalOpen(false)} className="text-gray-300 hover:text-red-400 text-2xl font-bold transition">&times;</button>
                    </div>

                    <div className="p-6 space-y-6">
                        
                        {/* Menampilkan Catatan Ditolak secara Jelas */}
                        {selectedPO.status_po === 'Ditolak' && selectedPO.catatan_kasppg && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                <p className="text-sm text-red-700 font-bold uppercase mb-1">Catatan Penolakan:</p>
                                <p className="text-sm text-red-800">{selectedPO.catatan_kasppg}</p>
                            </div>
                        )}

                        {/* Info Referensi */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div><p className="text-gray-500 text-xs font-bold uppercase">Menu Referensi</p><p className="font-bold text-gray-800">{selectedPO.nama_menu}</p></div>
                            <div><p className="text-gray-500 text-xs font-bold uppercase">Tanggal Jadwal</p><p className="font-bold text-gray-800">{formatDate(selectedPO.tanggal_jadwal)}</p></div>
                            <div><p className="text-gray-500 text-xs font-bold uppercase">Dibuat Oleh</p><p className="font-bold text-gray-800">{selectedPO.pembuat}</p></div>
                        </div>

                        {/* Tabel Rincian Barang & Grand Total */}
                        <div>
                            <table className="min-w-full border rounded-lg overflow-hidden text-sm">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Nama Barang</th>
                                        <th className="px-4 py-3 text-center">Qty/Satuan</th>
                                        <th className="px-4 py-3 text-right">Harga Satuan</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPO.rincian_barang.map((item, idx) => (
                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{item.nama_barang}</td>
                                            <td className="px-4 py-3 text-center font-bold text-blue-700">{item.qty} <span className="text-xs text-gray-500 font-normal">{item.satuan}</span></td>
                                            <td className="px-4 py-3 text-right">{formatRupiah(item.harga_satuan)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-900">{formatRupiah(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-b-lg border border-t-0 border-blue-200">
                                <h4 className="font-black text-blue-900 text-sm">GRAND TOTAL</h4>
                                <p className="font-black text-blue-900 text-lg">{formatRupiah(selectedPO.total_harga)}</p>
                            </div>

                            {/* Tombol Revisi: Hanya muncul jika Pending ATAU Ditolak DAN user adalah Akuntan/SA */}
                            {(selectedPO.status_po === 'Pending' || selectedPO.status_po === 'Ditolak') && canCreatePO && (
                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => triggerRevisi(selectedPO)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg text-sm shadow-sm transition">
                                        Revisi Purchase Order
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Histori */}
                        <div className="pt-4 border-t border-dashed border-gray-300">
                            <h4 className="font-bold text-gray-700 mb-3 text-sm">Histori Dokumen</h4>
                            <div className="space-y-2">
                                {selectedPO.histori && selectedPO.histori.length > 0 ? selectedPO.histori.map((h, i) => (
                                    <div key={i} className="flex gap-4 items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                                            <span className="font-medium text-gray-800"><strong>{h.action}</strong> oleh <span className="text-blue-700 font-bold">{h.action_by}</span></span>
                                        </div>
                                        <span className="text-gray-400 font-medium">{formatDateTime(h.action_at)}</span>
                                    </div>
                                )) : <p className="text-xs text-gray-500 italic">Tidak ada histori.</p>}
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default PO;