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

  // --- STATE MODAL DETAIL ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const role = localStorage.getItem('role');
  // Otorisasi: 1=Superadmin, 2=KaSPPG, 4=Akuntan
  const canCreateInvoice = role === '1' || role === '2' || role === '4';
  const canApproveInvoice = role === '1' || role === '2';

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resInv, resPO] = await Promise.all([
        api.get('/invoice'),
        api.get('/po')
      ]);
      setInvoiceList(resInv.data.data || []);
      // Hanya PO yang sudah disetujui yang bisa dibuatkan invoicenya
      setPoList((resPO.data.data || []).filter(po => po.status_po === 'Disetujui'));
    } catch (err) {
      setError('Gagal memuat data Invoice atau referensi PO.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectPO = (e) => {
    const selectedId = e.target.value;
    setIdPO(selectedId);
    const po = poList.find(p => p.id_po === parseInt(selectedId));
    
    if (po && po.rincian_barang) {
      const preparedItems = po.rincian_barang.map(item => ({
        ...item,
        checked: false,
        qty_riil: item.qty,
        harga_riil: item.harga_satuan,
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
        id_po: parseInt(idPO),
        tanggal_invoice: tanggalInvoice,
        supplier: supplier,
        rincian_invoice: selectedItems.map(item => ({
          id_barang: item.id_barang,
          harga_fix: parseInt(item.harga_riil),
          qty: parseInt(item.qty_riil),
          satuan: item.satuan
        }))
      };
      await api.post('/invoice', payload);
      alert('Invoice berhasil dicatat dan menunggu persetujuan!');
      setIdPO(''); setSupplier(''); setItemsFromPO([]); fetchData();
    } catch (err) {
      alert(err.response?.data?.pesan || 'Terjadi kesalahan.');
    } finally { setIsSubmitting(false); }
  };

  const handleApproveInvoice = async (id) => {
    if (!window.confirm('Setujui tagihan (Invoice) ini?')) return;
    try {
      await api.patch(`/invoice/${id}/status`, { status_invoice: 'Disetujui' });
      fetchData(); setDetailModalOpen(false);
    } catch (err) { alert('Gagal menyetujui invoice.'); }
  };

  const handleTolakInvoice = async (id) => {
    if (!window.confirm('Tolak tagihan (Invoice) ini?')) return;
    try {
      await api.patch(`/invoice/${id}/status`, { status_invoice: 'Ditolak' });
      fetchData(); setDetailModalOpen(false);
    } catch (err) { alert('Gagal menolak invoice.'); }
  };

  const handleHapusInvoice = async (id) => {
    if (!window.confirm('Hapus Invoice ini?')) return;
    try {
      await api.delete(`/invoice/${id}`);
      fetchData();
    } catch (err) { alert('Gagal menghapus invoice.'); }
  };

  const openDetail = (inv) => { setSelectedInvoice(inv); setDetailModalOpen(true); };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);

  return (
    <Layout title="Manajemen Invoice">
      <div className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">{error}</div>}

        {/* --- FORM INPUT INVOICE --- */}
        {canCreateInvoice && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-blue-900 mb-5">Catat Invoice Baru (Dari PO)</h3>
            <form onSubmit={handleSubmitInvoice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Referensi PO (Disetujui)</label>
                  <select required className="w-full p-2 border rounded-lg bg-white" value={idPO} onChange={handleSelectPO}>
                    <option value="">-- Pilih PO --</option>
                    {poList.map(po => <option key={po.id_po} value={po.id_po}>PO #{po.id_po} - {po.nama_menu}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Nama Supplier</label>
                  <input type="text" required className="w-full p-2 border rounded-lg" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nama Toko/Vendor" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Tanggal Terima</label>
                  <input type="date" className="w-full p-2 border rounded-lg" value={tanggalInvoice} onChange={(e) => setTanggalInvoice(e.target.value)} />
                </div>
              </div>

              {itemsFromPO.length > 0 && (
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                   <h4 className="text-sm font-bold text-orange-800 mb-3">Pilih Barang yang Diterima & Masukkan Harga Riil</h4>
                   <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-3 text-center">Pilih</th>
                            <th className="p-3 text-left">Barang</th>
                            <th className="p-3 text-center">Estimasi PO</th>
                            <th className="p-3 text-center w-32">Qty Riil</th>
                            <th className="p-3 text-center w-40">Harga Lapangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {itemsFromPO.map((item, idx) => (
                            <tr key={idx} className={item.checked ? "bg-orange-50" : ""}>
                              <td className="p-3 text-center">
                                <input type="checkbox" checked={item.checked} onChange={(e) => handleItemChange(idx, 'checked', e.target.checked)} />
                              </td>
                              <td className="p-3 font-bold">{item.nama_barang}</td>
                              <td className="p-3 text-center text-gray-500 italic">
                                {item.qty} {item.satuan} @ {formatRupiah(item.harga_satuan)}
                              </td>
                              <td className="p-3">
                                <input type="number" disabled={!item.checked} className="w-full p-1 border rounded text-center" value={item.qty_riil} onChange={(e) => handleItemChange(idx, 'qty_riil', e.target.value)} />
                              </td>
                              <td className="p-3">
                                <input type="number" disabled={!item.checked} className="w-full p-1 border rounded text-center" value={item.harga_riil} onChange={(e) => handleItemChange(idx, 'harga_riil', e.target.value)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                   </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSubmitting || !idPO} className={`font-bold py-3 px-8 rounded-lg text-white ${isSubmitting || !idPO ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700'}`}>
                  {isSubmitting ? 'Memproses...' : 'Simpan Invoice'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- TABEL DAFTAR INVOICE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Tgl / Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Ref PO</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Total Tagihan</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : (
                invoiceList.map((inv) => (
                  <tr key={inv.id_invoice} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                        {new Date(inv.tanggal_invoice).toLocaleDateString('id-ID')}
                        <p className="text-xs text-gray-400 font-normal">{inv.supplier}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">PO #{inv.id_po}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-gray-800">{formatRupiah(inv.total_tagihan)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${inv.status_invoice === 'Pending' ? 'bg-yellow-100 text-yellow-800' : inv.status_invoice === 'Disetujui' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {inv.status_invoice || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium space-x-2">
                      <button onClick={() => openDetail(inv)} className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded shadow-sm">Detail</button>
                      {(inv.status_invoice === 'Pending' || !inv.status_invoice) && canCreateInvoice && (
                        <button onClick={() => handleHapusInvoice(inv.id_invoice)} className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded shadow-sm">Hapus</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- MODAL DETAIL INVOICE --- */}
        {detailModalOpen && selectedInvoice && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-xl font-black text-orange-900">Detail Invoice #{selectedInvoice.id_invoice}</h3>
                        <button onClick={() => setDetailModalOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 text-sm gap-4">
                            <p><strong>Supplier:</strong> {selectedInvoice.supplier}</p>
                            <p><strong>Tanggal:</strong> {new Date(selectedInvoice.tanggal_invoice).toLocaleDateString('id-ID')}</p>
                            <p><strong>Referensi:</strong> PO #{selectedInvoice.id_po}</p>
                            <p><strong>Dibuat Oleh:</strong> {selectedInvoice.pembuat}</p>
                        </div>
                        <table className="min-w-full border rounded-lg text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left">Nama Barang</th>
                                    <th className="px-4 py-2 text-center">Qty/Satuan</th>
                                    <th className="px-4 py-2 text-right">Harga Fix</th>
                                    <th className="px-4 py-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedInvoice.rincian_tagihan?.map((item, idx) => (
                                    <tr key={idx} className="border-t">
                                        <td className="px-4 py-2">{item.nama_barang}</td>
                                        <td className="px-4 py-2 text-center font-bold text-orange-700">{item.qty} {item.satuan}</td>
                                        <td className="px-4 py-2 text-right">{formatRupiah(item.harga_satuan)}</td>
                                        <td className="px-4 py-2 text-right font-medium">{formatRupiah(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-orange-50 font-bold border-t">
                                <tr>
                                    <td colSpan="3" className="px-4 py-3 text-right">TOTAL TAGIHAN:</td>
                                    <td className="px-4 py-3 text-right">{formatRupiah(selectedInvoice.total_tagihan)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        {/* TOMBOL APPROVAL (KASPPG ONLY) */}
                        {(selectedInvoice.status_invoice === 'Pending' || !selectedInvoice.status_invoice) && canApproveInvoice && (
                            <div className="flex gap-3 pt-4 border-t">
                                <button onClick={() => handleApproveInvoice(selectedInvoice.id_invoice)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">Setujui Invoice</button>
                                <button onClick={() => handleTolakInvoice(selectedInvoice.id_invoice)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg">Tolak Invoice</button>
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

export default Invoice;