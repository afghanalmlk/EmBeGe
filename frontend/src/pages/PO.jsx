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
  
  // State Keranjang Belanja
  const [cart, setCart] = useState([]);
  const [selectedBarang, setSelectedBarang] = useState('');
  const [qtyBarang, setQtyBarang] = useState('');
  const [satuanBarang, setSatuanBarang] = useState(''); // STATE BARU: SATUAN
  const [hargaBarang, setHargaBarang] = useState('');

  // State Modal Detail
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const role = localStorage.getItem('role');
  const canCreatePO = role === '1' || role === '2' || role === '4';
  const canApprovePO = role === '1' || role === '2'; 

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [resPO, resMenu, resBarang] = await Promise.all([
        api.get('/po'), api.get('/menu'), api.get('/barang')
      ]);
      setPoList(resPO.data.data || []);
      setMenuList((resMenu.data.data || []).filter(m => m.id_jadwal != null));
      setBarangList(resBarang.data.data || []);
    } catch (err) {
      setError('Gagal memuat data PO atau Master Data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddToCart = () => {
    // Validasi tambahan untuk satuan
    if (!selectedBarang || !qtyBarang || !satuanBarang || !hargaBarang) {
      return alert('Pilih barang, masukkan kuantitas, SATUAN, dan harga!');
    }
    
    const barangObj = barangList.find(b => b.id_barang === parseInt(selectedBarang));
    if (cart.findIndex(item => item.id_barang === parseInt(selectedBarang)) >= 0) {
      return alert('Barang sudah ada di daftar. Hapus dulu jika ingin mengubah.');
    }

    setCart([...cart, { 
        id_barang: parseInt(selectedBarang), 
        nama_barang: barangObj.nama_barang, 
        qty_barang: parseInt(qtyBarang), 
        satuan: satuanBarang.trim(), // Masukkan satuan
        harga_barang: parseInt(hargaBarang),
        subtotal: parseInt(qtyBarang) * parseInt(hargaBarang)
    }]);

    // Reset input
    setSelectedBarang(''); setQtyBarang(''); setSatuanBarang(''); setHargaBarang('');
  };

  const handleRemoveFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Daftar barang tidak boleh kosong!');
    if (!idJadwalMenu) return alert('Pilih jadwal menu!');
    setIsSubmitting(true);
    try {
      await api.post('/po', { id_jadwal_menu: parseInt(idJadwalMenu), tanggal_po: tanggalPO, daftar_barang: cart });
      alert('Purchase Order berhasil diajukan!');
      setIdJadwalMenu(''); setCart([]); fetchData();
    } catch (err) {
      alert(err.response?.data?.pesan || 'Terjadi kesalahan.');
    } finally { setIsSubmitting(false); }
  };

  const handleApprovePO = async (id_po) => {
    if (!window.confirm('Setujui Purchase Order ini?')) return;
    try { await api.put(`/po/${id_po}/status`, { status_po: 'Disetujui' }); fetchData(); setDetailModalOpen(false); } catch (err) { alert(err.response?.data?.pesan); }
  };

  const handleTolakPO = async (id_po) => {
    if (!window.confirm('Tolak Purchase Order ini?')) return;
    try { await api.put(`/po/${id_po}/status`, { status_po: 'Ditolak' }); fetchData(); setDetailModalOpen(false); } catch (err) { alert(err.response?.data?.pesan); }
  };

  const handleHapusPO = async (id_po) => {
    if (!window.confirm('Hapus PO ini?')) return;
    try { await api.delete(`/po/${id_po}`); fetchData(); } catch (err) { alert(err.response?.data?.pesan); }
  };

  const openDetail = (po) => { setSelectedPO(po); setDetailModalOpen(true); };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });

  return (
    <Layout title="Purchase Order (PO)">
      <div className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">{error}</div>}

        {canCreatePO && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-blue-900 mb-5">Ajukan Purchase Order Baru</h3>
            <form onSubmit={handleSubmitPO} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Tanggal PO</label>
                  <input type="date" required className="w-full p-2 border rounded-lg" value={tanggalPO} onChange={(e) => setTanggalPO(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Untuk Jadwal Menu</label>
                  <select required className="w-full p-2 border rounded-lg bg-white" value={idJadwalMenu} onChange={(e) => setIdJadwalMenu(e.target.value)}>
                    <option value="" disabled>-- Pilih Jadwal Menu --</option>
                    {menuList.map(m => <option key={m.id_jadwal} value={m.id_jadwal}>{new Date(m.tanggal).toLocaleDateString('id-ID')} - {m.nama_menu}</option>)}
                  </select>
                </div>
              </div>

              {/* KERANJANG BELANJA (CART) */}
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-3">Input Rincian Barang</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1">Pilih Barang</label>
                    <select className="w-full p-2 border rounded-md bg-white text-sm" value={selectedBarang} onChange={(e) => setSelectedBarang(e.target.value)}>
                      <option value="" disabled>-- Pilih Barang --</option>
                      {barangList.map(b => <option key={b.id_barang} value={b.id_barang}>{b.nama_barang}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Qty</label>
                    <input type="number" min="1" placeholder="Jumlah" className="w-full p-2 border rounded-md text-sm" value={qtyBarang} onChange={(e) => setQtyBarang(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Satuan</label>
                    <input type="text" placeholder="Kg, Ltr, Bks" className="w-full p-2 border rounded-md text-sm uppercase" value={satuanBarang} onChange={(e) => setSatuanBarang(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Harga Satuan (Rp)</label>
                    <input type="number" min="1" placeholder="Harga" className="w-full p-2 border rounded-md text-sm" value={hargaBarang} onChange={(e) => setHargaBarang(e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={handleAddToCart} className="mt-3 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm w-full md:w-auto">+ Tambah ke Daftar</button>

                {cart.length > 0 && (
                  <div className="mt-4 bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-bold text-gray-500">Nama Barang</th>
                          <th className="px-4 py-2 text-center font-bold text-gray-500">Qty / Satuan</th>
                          <th className="px-4 py-2 text-right font-bold text-gray-500">Harga Satuan</th>
                          <th className="px-4 py-2 text-right font-bold text-gray-500">Subtotal</th>
                          <th className="px-4 py-2 text-center font-bold text-gray-500">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cart.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-medium">{item.nama_barang}</td>
                            <td className="px-4 py-2 text-center font-bold text-blue-700">{item.qty_barang} <span className="text-xs font-normal text-gray-500">{item.satuan}</span></td>
                            <td className="px-4 py-2 text-right">{formatRupiah(item.harga_barang)}</td>
                            <td className="px-4 py-2 text-right font-bold text-blue-800">{formatRupiah(item.subtotal)}</td>
                            <td className="px-4 py-2 text-center"><button type="button" onClick={() => handleRemoveFromCart(idx)} className="text-red-500 font-bold">&times;</button></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-blue-100 font-bold">
                        <tr>
                          <td colSpan="3" className="px-4 py-2 text-right text-blue-900">TOTAL ESTIMASI:</td>
                          <td className="px-4 py-2 text-right text-blue-900">{formatRupiah(cart.reduce((sum, item) => sum + item.subtotal, 0))}</td><td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSubmitting || cart.length === 0} className={`font-bold py-3 px-8 rounded-lg text-white ${isSubmitting || cart.length === 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
                  {isSubmitting ? 'Mengajukan PO...' : 'Ajukan Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- TABEL DAFTAR PO --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Tgl PO</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Menu & Pembuat</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Total Harga</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : poList.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada data Purchase Order.</td></tr>
              ) : (
                poList.map((po) => (
                  <tr key={po.id_po} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">{new Date(po.tanggal_po).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 text-sm"><p className="font-bold text-blue-900">{po.nama_menu}</p><p className="text-xs text-gray-500 mt-1">Oleh: {po.pembuat}</p></td>
                    <td className="px-6 py-4 text-right text-sm font-black text-gray-800">{formatRupiah(po.total_harga)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${po.status_po === 'Pending' ? 'bg-yellow-100 text-yellow-800' : po.status_po === 'Disetujui' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {po.status_po}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium space-x-2">
                      <button onClick={() => openDetail(po)} className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded shadow-sm">Detail</button>
                      {po.status_po === 'Pending' && canCreatePO && (
                        <button onClick={() => handleHapusPO(po.id_po)} className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded shadow-sm">Hapus</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- MODAL DETAIL PO & HISTORI --- */}
        {detailModalOpen && selectedPO && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                        <div>
                            <h3 className="text-xl font-black text-blue-900">Detail PO #{selectedPO.id_po}</h3>
                            <p className="text-sm font-medium text-gray-500 mt-1">Menu: {selectedPO.nama_menu}</p>
                        </div>
                        <button onClick={() => setDetailModalOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">&times;</button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* RINCIAN BARANG */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">Daftar Barang Dipesan</h4>
                            <table className="min-w-full border rounded-lg overflow-hidden text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-gray-600">Nama Barang</th>
                                        <th className="px-4 py-2 text-center text-gray-600">Qty/Satuan</th>
                                        <th className="px-4 py-2 text-right text-gray-600">Harga Satuan</th>
                                        <th className="px-4 py-2 text-right text-gray-600">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPO.rincian_barang.map((item, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="px-4 py-2">{item.nama_barang}</td>
                                            <td className="px-4 py-2 text-center font-bold text-blue-700">{item.qty} <span className="text-xs font-normal text-gray-500">{item.satuan}</span></td>
                                            <td className="px-4 py-2 text-right">{formatRupiah(item.harga_satuan)}</td>
                                            <td className="px-4 py-2 text-right font-medium">{formatRupiah(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-blue-50 font-bold border-t border-blue-200">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right text-blue-900">GRAND TOTAL:</td>
                                        <td className="px-4 py-3 text-right text-blue-900">{formatRupiah(selectedPO.total_harga)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* HISTORI AKSI */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">Histori Dokumen</h4>
                            <div className="space-y-3">
                                {selectedPO.histori ? selectedPO.histori.map((h, i) => (
                                    <div key={i} className="flex gap-4 items-start bg-gray-50 p-3 rounded-lg border">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{h.action}</p>
                                            <p className="text-xs text-gray-500 mt-1">Oleh: <span className="font-semibold text-blue-700">{h.action_by}</span> | {formatDate(h.action_at)}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-gray-500">Tidak ada histori.</p>}
                            </div>
                        </div>

                        {/* TOMBOL AKSI */}
                        {selectedPO.status_po === 'Pending' && canApprovePO && (
                            <div className="flex gap-3 pt-4 border-t">
                                <button onClick={() => handleApprovePO(selectedPO.id_po)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">Setujui PO</button>
                                <button onClick={() => handleTolakPO(selectedPO.id_po)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg">Tolak PO</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default PO;