import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import Layout from '../components/Layout';

const Invoice = () => {
  const [invoiceList, setInvoiceList] = useState([]);
  const [poList, setPoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // --- STATE FORM ---
  const [idPO, setIdPO] = useState('');
  const [supplier, setSupplier] = useState('');
  const [tanggalInvoice, setTanggalInvoice] = useState(new Date().toISOString().split('T')[0]);
  const [itemsFromPO, setItemsFromPO] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [invoiceToEditId, setInvoiceToEditId] = useState(null);

  // --- STATE MODAL DETAIL ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const roleId = parseInt(localStorage.getItem('role'));
  const isSuperadmin = roleId === 1;
  const isKaSPPG = roleId === 2;
  const isAkuntan = roleId === 4;

  const canCreateInvoice = isSuperadmin || isAkuntan;
  const canApproveInvoice = isSuperadmin || isKaSPPG;

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [resInv, resPO] = await Promise.all([
        api.get('/invoice'), api.get('/po')
      ]);
      setInvoiceList(resInv.data.data || []);
      setPoList((resPO.data.data || []).filter(po => po.status_po === 'Disetujui'));
    } catch (err) { setError('Gagal memuat data Invoice atau referensi PO.'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectPO = (e) => {
    const selectedId = e.target.value;
    setIdPO(selectedId);
    const po = poList.find(p => p.id_po === parseInt(selectedId));
    
    if (po && po.rincian_barang) {
      const preparedItems = po.rincian_barang.map(item => ({
        ...item, checked: false, qty_riil: item.qty, harga_riil: item.harga_satuan,
      }));
      setItemsFromPO(preparedItems);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...itemsFromPO];
    updated[index][field] = value;
    setItemsFromPO(updated);
  };

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    const selectedItems = itemsFromPO.filter(item => item.checked);
    if (selectedItems.length === 0) return alert("Pilih minimal satu barang yang diterima!");

    setIsSubmitting(true);
    try {
      const payload = {
        id_po: parseInt(idPO), tanggal_invoice: tanggalInvoice, supplier: supplier,
        rincian_invoice: selectedItems.map(item => ({
          id_barang: item.id_barang, harga_fix: parseInt(item.harga_riil), qty: parseInt(item.qty_riil), satuan: item.satuan
        }))
      };

      if (isEditMode) {
          await api.patch(`/invoice/${invoiceToEditId}`, payload);
          alert('Invoice berhasil direvisi!');
          setIsEditMode(false); setInvoiceToEditId(null);
      } else {
          await api.post('/invoice', payload);
          alert('Invoice berhasil dicatat!');
      }
      
      setIdPO(''); setSupplier(''); setItemsFromPO([]); setTanggalInvoice(new Date().toISOString().split('T')[0]); fetchData();
    } catch (err) { alert(err.response?.data?.pesan || 'Terjadi kesalahan.'); } 
    finally { setIsSubmitting(false); }
  };

  const triggerRevisi = (inv) => {
      setIsEditMode(true);
      setInvoiceToEditId(inv.id_invoice);
      setTanggalInvoice(new Date(inv.tanggal_invoice).toISOString().split('T')[0]);
      setSupplier(inv.supplier);
      setIdPO(inv.id_po);

      const poTerkait = poList.find(p => p.id_po === parseInt(inv.id_po));
      if (poTerkait) {
          // Gabungkan rincian PO dengan rincian Invoice yang sudah ada sebelumnya
          const mergedItems = poTerkait.rincian_barang.map(poItem => {
              const existingInvItem = inv.rincian_tagihan.find(i => i.id_barang === poItem.id_barang);
              return {
                  ...poItem,
                  checked: !!existingInvItem,
                  qty_riil: existingInvItem ? existingInvItem.qty : poItem.qty,
                  harga_riil: existingInvItem ? existingInvItem.harga_fix : poItem.harga_satuan,
              };
          });
          setItemsFromPO(mergedItems);
      }

      setDetailModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBatalEdit = () => {
      setIsEditMode(false); setInvoiceToEditId(null); setIdPO(''); setSupplier(''); setItemsFromPO([]); setTanggalInvoice(new Date().toISOString().split('T')[0]);
  };

  const handleApproveInvoice = async (id) => {
    if (!window.confirm('Setujui tagihan (Invoice) ini?')) return;
    try { await api.patch(`/invoice/${id}/status`, { status_invoice: 'Disetujui' }); fetchData(); setDetailModalOpen(false); } 
    catch (err) { alert('Gagal menyetujui invoice.'); }
  };

  const handleTolakInvoice = async (id) => {
    const alasan = window.prompt('Masukkan catatan/alasan penolakan Tagihan:');
    if (alasan === null) return;
    try { await api.patch(`/invoice/${id}/status`, { status_invoice: 'Ditolak', catatan: alasan }); fetchData(); setDetailModalOpen(false); } 
    catch (err) { alert(err.response?.data?.pesan); }
  };

  const openDetail = (inv) => { setSelectedInvoice(inv); setDetailModalOpen(true); };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const formatDateTime = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : '-';

  return (
    <Layout title="Manajemen Invoice">
      <div className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">{error}</div>}

        {/* --- FORM INPUT INVOICE --- */}
        {canCreateInvoice && (
          <div className={`p-6 rounded-xl shadow-sm border ${isEditMode ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-bold mb-5 ${isEditMode ? 'text-orange-900' : 'text-blue-900'}`}>
                {isEditMode ? `Revisi Invoice #${invoiceToEditId}` : 'Catat Invoice Baru (Dari PO)'}
            </h3>
            <form onSubmit={handleSubmitInvoice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Tanggal Terima</label>
                  <input type="date" required className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" value={tanggalInvoice} onChange={(e) => setTanggalInvoice(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Referensi PO (Disetujui)</label>
                  <select required className="w-full p-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" value={idPO} onChange={handleSelectPO}>
                    <option value="" disabled>-- Pilih PO --</option>
                    {poList.map(po => <option key={po.id_po} value={po.id_po}>PO #{po.id_po} - {po.nama_menu}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Nama Supplier</label>
                  <input type="text" required className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nama Toko/Vendor" />
                </div>
              </div>

              {itemsFromPO.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                   <h4 className="text-sm font-bold text-gray-700 mb-3">Pilih Barang yang Diterima & Harga Riil</h4>
                   <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase">Pilih</th>
                            <th className="px-4 py-3 text-left text-gray-500 font-bold uppercase">Barang</th>
                            <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase">Estimasi PO</th>
                            <th className="px-4 py-3 text-center w-32 text-gray-500 font-bold uppercase">Qty Riil</th>
                            <th className="px-4 py-3 text-center w-40 text-gray-500 font-bold uppercase">Harga Lapangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {itemsFromPO.map((item, idx) => (
                            <tr key={idx} className={item.checked ? "bg-orange-50/50" : ""}>
                              <td className="px-4 py-3 text-center"><input type="checkbox" className="w-4 h-4 text-orange-600" checked={item.checked} onChange={(e) => handleItemChange(idx, 'checked', e.target.checked)} /></td>
                              <td className="px-4 py-3 font-bold text-gray-800">{item.nama_barang}</td>
                              <td className="px-4 py-3 text-center text-gray-500 italic text-xs">{item.qty} {item.satuan} @ {formatRupiah(item.harga_satuan)}</td>
                              <td className="px-4 py-3"><input type="number" disabled={!item.checked} className="w-full p-2 border rounded-md text-center outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100" value={item.qty_riil} onChange={(e) => handleItemChange(idx, 'qty_riil', e.target.value)} /></td>
                              <td className="px-4 py-3"><input type="number" disabled={!item.checked} className="w-full p-2 border rounded-md text-center outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100" value={item.harga_riil} onChange={(e) => handleItemChange(idx, 'harga_riil', e.target.value)} /></td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                   </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                 {isEditMode && (
                     <button type="button" onClick={handleBatalEdit} className="font-bold py-3 px-8 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 w-full md:w-auto">Batal Revisi</button>
                 )}
                 <button type="submit" disabled={isSubmitting || !idPO} className={`font-bold py-3 px-8 rounded-lg text-white w-full md:w-auto transition shadow-sm ${isSubmitting || !idPO ? 'bg-gray-400' : isEditMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                   {isSubmitting ? 'Memproses...' : isEditMode ? 'Simpan Revisi Invoice' : 'Simpan Invoice Baru'}
                 </button>
              </div>
            </form>
          </div>
        )}

        {/* --- TABEL DAFTAR INVOICE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase w-1/4">Tgl / Supplier / INV</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase w-1/3">Ref PO & Menu</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase">Status & Persetujuan</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan="4" className="p-8 text-center text-gray-500">Memuat data...</td></tr> : invoiceList.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-gray-500">Belum ada data Invoice.</td></tr> : invoiceList.map((inv) => (
                  <tr key={inv.id_invoice} className="hover:bg-orange-50 transition">
                    <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{formatDate(inv.tanggal_invoice)}</p>
                        <p className="text-xs text-gray-500 mt-1">INV #{inv.id_invoice} | Toko: <span className="font-bold text-gray-700">{inv.supplier}</span></p>
                    </td>
                    <td className="px-6 py-4">
                        <p className="font-bold text-blue-900">PO #{inv.id_po}</p>
                        <p className="text-xs text-gray-500 mt-1">Menu: {inv.nama_menu} ({formatDate(inv.tanggal_jadwal)})</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full ${inv.status_invoice === 'Pending' ? 'bg-yellow-100 text-yellow-800' : inv.status_invoice === 'Disetujui' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {inv.status_invoice || 'Pending'}
                        </span>
                        
                        {inv.status_invoice === 'Ditolak' && inv.catatan_kasppg && (
                           <p className="text-[10px] text-red-500 italic mt-1 max-w-[150px] truncate" title={inv.catatan_kasppg}>Catatan: {inv.catatan_kasppg}</p>
                        )}

                        {(inv.status_invoice === 'Pending' || !inv.status_invoice) && canApproveInvoice && isKaSPPG && (
                           <div className="flex gap-1 mt-1">
                             <button onClick={() => handleApproveInvoice(inv.id_invoice)} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm transition">Setujui</button>
                             <button onClick={() => handleTolakInvoice(inv.id_invoice)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm transition">Tolak</button>
                           </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openDetail(inv)} className="text-orange-600 hover:text-white border border-orange-600 hover:bg-orange-600 px-4 py-1.5 rounded-lg shadow-sm text-xs font-bold transition">Lihat Detail</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* --- MODAL DETAIL INVOICE --- */}
        {detailModalOpen && selectedInvoice && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                    
                    <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-orange-700 text-white z-10">
                        <div>
                            <h3 className="text-xl font-black">Invoice #{selectedInvoice.id_invoice}</h3>
                            <p className="text-sm font-medium text-orange-200 mt-1">Tagihan untuk PO #{selectedInvoice.id_po}</p>
                        </div>
                        <button onClick={() => setDetailModalOpen(false)} className="text-gray-300 hover:text-red-400 text-2xl font-bold transition">&times;</button>
                    </div>

                    <div className="p-6 space-y-6">
                        
                        {selectedInvoice.status_invoice === 'Ditolak' && selectedInvoice.catatan_kasppg && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                <p className="text-sm text-red-700 font-bold uppercase mb-1">Catatan Penolakan KaSPPG:</p>
                                <p className="text-sm text-red-800">{selectedInvoice.catatan_kasppg}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100 text-sm">
                            <div><p className="text-gray-500 text-xs uppercase font-bold">Supplier</p><p className="font-bold text-gray-800">{selectedInvoice.supplier}</p></div>
                            <div><p className="text-gray-500 text-xs uppercase font-bold">Menu & Tgl Jadwal</p><p className="font-bold text-gray-800">{selectedInvoice.nama_menu} <br/><span className="font-normal text-xs">{formatDate(selectedInvoice.tanggal_jadwal)}</span></p></div>
                            <div><p className="text-gray-500 text-xs uppercase font-bold">Ref PO</p><p className="font-bold text-blue-700">PO #{selectedInvoice.id_po}</p></div>
                            <div><p className="text-gray-500 text-xs uppercase font-bold">Dibuat Oleh</p><p className="font-bold text-gray-800">{selectedInvoice.pembuat}</p></div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">Rincian Tagihan Lapangan</h4>
                            <table className="min-w-full border rounded-lg overflow-hidden text-sm">
                                <thead className="bg-gray-100 text-gray-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Nama Barang</th>
                                        <th className="px-4 py-3 text-center">Qty/Satuan</th>
                                        <th className="px-4 py-3 text-right">Harga Fix</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoice.rincian_tagihan?.map((item, idx) => (
                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{item.nama_barang}</td>
                                            <td className="px-4 py-3 text-center font-bold text-orange-700">{item.qty} <span className="text-xs font-normal text-gray-500">{item.satuan}</span></td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="block text-[10px] text-gray-400 line-through">PO: {formatRupiah(item.harga_po)}</span>
                                                {formatRupiah(item.harga_fix)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-orange-900">{formatRupiah(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-between items-center p-4 bg-orange-50 border border-t-0 rounded-b-lg border-orange-200">
                                <span className="font-black text-orange-900 text-sm">GRAND TOTAL TAGIHAN</span>
                                <span className="font-black text-orange-900 text-lg">{formatRupiah(selectedInvoice.total_tagihan)}</span>
                            </div>

                            {/* Tombol Revisi: Hanya jika Pending/Ditolak dan milik user yang login */}
                            {(!selectedInvoice.status_invoice || selectedInvoice.status_invoice === 'Pending' || selectedInvoice.status_invoice === 'Ditolak') && selectedInvoice.is_mine && canCreateInvoice && (
                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => triggerRevisi(selectedInvoice)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-sm shadow-sm transition">
                                        Perbaiki / Revisi Invoice
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* HISTORI DOKUMEN */}
                        <div className="pt-4 border-t border-dashed border-gray-300">
                            <h4 className="font-bold text-gray-700 mb-3 text-sm">Histori Dokumen</h4>
                            <div className="space-y-2">
                                {selectedInvoice.histori && selectedInvoice.histori.length > 0 ? selectedInvoice.histori.map((h, i) => (
                                    <div key={i} className="flex gap-4 items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></div>
                                            <span className="font-medium text-gray-800"><strong>{h.action}</strong> oleh <span className="text-orange-700 font-bold">{h.action_by}</span></span>
                                        </div>
                                        <span className="text-gray-400 font-medium">{formatDateTime(h.action_at)}</span>
                                    </div>
                                )) : <p className="text-xs text-gray-500 italic">Tidak ada histori tindakan yang terekam untuk dokumen ini.</p>}
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

export default Invoice;