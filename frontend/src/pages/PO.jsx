import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const PO = () => {
  // State untuk List PO
  const [poList, setPoList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State untuk Mode Tampilan ('list' atau 'create')
  const [viewMode, setViewMode] = useState('list');

  // State untuk Data Master (Menu & Barang) di Form PO
  const [menuList, setMenuList] = useState([]);
  const [barangList, setBarangList] = useState([]);

  // State untuk Form PO Baru
  const [selectedMenu, setSelectedMenu] = useState('');
  const [poDetails, setPoDetails] = useState([
    { id_barang: '', qty: 1, satuan: 'Kg', harga_satuan: 0 }
  ]);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // --- 1. Mengambil Daftar PO ---
  const fetchPO = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/po', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setPoList(data.data || []);
      else if (response.status === 401) navigate('/login');
    } catch (err) {
      setError('Gagal mengambil data PO.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. Mengambil Data Master untuk Form ---
  const fetchMasterData = async () => {
    try {
      const [resMenu, resBarang] = await Promise.all([
        fetch('http://localhost:5000/menu', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5000/barang', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const dataMenu = await resMenu.json();
      const dataBarang = await resBarang.json();
      
      if (resMenu.ok) setMenuList(dataMenu.data || []);
      if (resBarang.ok) setBarangList(dataBarang.data || []);
    } catch (err) {
      alert('Gagal memuat data Menu atau Barang untuk formulir.');
    }
  };

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchPO();
  }, [navigate, token]);

  // --- 3. Logika Form Dinamis PO ---
  const handleOpenForm = () => {
    fetchMasterData();
    setViewMode('create');
  };

  const handleCloseForm = () => {
    setViewMode('list');
    setSelectedMenu('');
    setPoDetails([{ id_barang: '', qty: 1, satuan: 'Kg', harga_satuan: 0 }]);
  };

  const handleAddRow = () => {
    setPoDetails([...poDetails, { id_barang: '', qty: 1, satuan: 'Kg', harga_satuan: 0 }]);
  };

  const handleRemoveRow = (index) => {
    const newDetails = [...poDetails];
    newDetails.splice(index, 1);
    setPoDetails(newDetails);
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...poDetails];
    newDetails[index][field] = value;
    setPoDetails(newDetails);
  };

  const totalEstimasi = poDetails.reduce((sum, item) => sum + (Number(item.qty) * Number(item.harga_satuan)), 0);

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (!selectedMenu) return alert("Pilih menu terlebih dahulu!");
    
    // Validasi apakah ada barang yang kosong
    const isDetailValid = poDetails.every(d => d.id_barang && Number(d.qty) > 0 && Number(d.harga_satuan) >= 0);
    if (!isDetailValid) return alert("Pastikan semua baris barang telah dipilih dan memiliki jumlah (Qty).");

    // FORMATTING DATA: Mengubah string dari input menjadi Angka murni (Integer/Float)
    const payload = {
        id_menu: parseInt(selectedMenu),
        tanggal_po: new Date().toISOString().split('T')[0], // KODE BARU: Mengambil tanggal hari ini (Format: YYYY-MM-DD)
        total_harga: totalEstimasi,
        detail_po: poDetails.map(d => ({
          id_barang: parseInt(d.id_barang),
          qty: parseFloat(d.qty),
          satuan: d.satuan,
          harga_satuan: parseFloat(d.harga_satuan),
          harga_estimasi: parseFloat(d.harga_satuan)
        }))
      };

    try {
      const response = await fetch('http://localhost:5000/po', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload) // Mengirim data yang sudah dibersihkan
      });
      
      const data = await response.json();
      if (response.ok) {
        alert("Purchase Order berhasil dibuat!");
        handleCloseForm();
        fetchPO();
      } else {
        alert(data.pesan);
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan saat menyimpan PO.");
    }
  };



  // --- Fungsi Desain Label Status ---
  const getStatusStyle = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s === 'disetujui') return 'bg-embege-green/20 text-embege-primary border-embege-green';
    if (s === 'ditolak') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-embege-gold/20 text-[#a38036] border-embege-gold'; // Pending
  };

  return (
    <Layout title="Purchase Order (PO)">
      <div className="space-y-6">
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {/* --- VIEW MODE: LIST PO --- */}
        {viewMode === 'list' && (
          <>
            <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-embege-primary">Riwayat Pesanan Belanja</h3>
                <p className="text-sm text-gray-500 mt-1">Kelola dan pantau status persetujuan PO di sini.</p>
              </div>
              <button 
                onClick={handleOpenForm}
                className="bg-embege-primary hover:bg-[#132a5e] text-white font-bold py-2.5 px-6 rounded-lg transition duration-200 shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Buat PO Baru
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-embege-light text-embege-primary border-b border-embege-primary/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">No. PO</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">Tgl Pesan</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">Untuk Menu</th>
                    <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider">Total Harga</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium">Memuat data pesanan...</td></tr>
                  ) : (!Array.isArray(poList) || poList.length === 0) ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Belum ada riwayat Purchase Order.
                      </td>
                    </tr>
                  ) : (
                    poList.map((po) => (
                      <tr key={po.id_po} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-embege-primary">
                          #PO-{po.id_po}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          {new Date(po.tanggal_po).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                          {po.nama_menu || 'Menu Terhapus'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getStatusStyle(po.status_po)}`}>
                            {po.status_po}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-extrabold text-embege-primary">
                          Rp {Number(po.total_harga).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- VIEW MODE: FORM BUAT PO BARU --- */}
        {viewMode === 'create' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-embege-primary flex items-center gap-2">
                <svg className="w-6 h-6 text-embege-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Formulir Purchase Order
              </h3>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-red-500 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-6">
              {/* Pilihan Menu */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-embege-primary mb-2">1. Pilih Jadwal Menu yang akan Dibelanjakan</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-embege-light focus:border-embege-primary outline-none bg-white font-medium"
                  value={selectedMenu}
                  onChange={(e) => setSelectedMenu(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Klik untuk Memilih Menu --</option>
                  {menuList.map(m => (
                    <option key={m.id_menu} value={m.id_menu}>
                      {new Date(m.tanggal).toLocaleDateString('id-ID')} | {m.nama_menu}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rincian Barang */}
              <div>
                <label className="block text-sm font-bold text-embege-primary mb-3">2. Rincian Bahan Baku</label>
                
                <div className="space-y-3">
                  {poDetails.map((detail, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-end bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                      
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Barang</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-embege-light outline-none text-sm"
                          value={detail.id_barang}
                          onChange={(e) => handleDetailChange(index, 'id_barang', e.target.value)}
                          required
                        >
                          <option value="" disabled>Pilih Barang</option>
                          {barangList.map(b => (
                            <option key={b.id_barang} value={b.id_barang}>{b.nama_barang}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-24">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Qty</label>
                        <input 
                          type="number" min="0.1" step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-embege-light outline-none text-sm"
                          value={detail.qty}
                          onChange={(e) => handleDetailChange(index, 'qty', e.target.value)}
                          required
                        />
                      </div>

                      <div className="w-full md:w-24">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Satuan</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-embege-light outline-none text-sm"
                          value={detail.satuan}
                          onChange={(e) => handleDetailChange(index, 'satuan', e.target.value)}
                        >
                          <option value="Kg">Kg</option>
                          <option value="Liter">Liter</option>
                          <option value="Ikat">Ikat</option>
                          <option value="Pcs">Pcs</option>
                          <option value="Pack">Pack</option>
                        </select>
                      </div>

                      <div className="w-full md:w-40">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Harga Satuan (Rp)</label>
                        <input 
                          type="number" min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-embege-light outline-none text-sm"
                          value={detail.harga_satuan}
                          onChange={(e) => handleDetailChange(index, 'harga_satuan', e.target.value)}
                          required
                        />
                      </div>

                      <button 
                        type="button" 
                        onClick={() => handleRemoveRow(index)}
                        disabled={poDetails.length === 1}
                        className={`p-2 rounded-md transition ${poDetails.length === 1 ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  onClick={handleAddRow}
                  className="mt-3 text-sm font-bold text-embege-primary bg-embege-light/40 hover:bg-embege-light/80 py-2 px-4 rounded-lg transition border border-embege-light flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Tambah Baris Barang
                </button>
              </div>

              {/* Total & Submit */}
              <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-left w-full md:w-auto">
                  <p className="text-sm font-semibold text-gray-500">Estimasi Total Biaya:</p>
                  <p className="text-2xl font-black text-embege-primary">Rp {totalEstimasi.toLocaleString('id-ID')}</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    type="button" 
                    onClick={handleCloseForm}
                    className="flex-1 md:flex-none bg-white border border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 md:flex-none bg-embege-green hover:brightness-95 text-embege-primary font-extrabold py-3 px-8 rounded-lg transition shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Simpan Purchase Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default PO;