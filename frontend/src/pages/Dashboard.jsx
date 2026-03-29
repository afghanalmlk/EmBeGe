import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [menus, setMenus] = useState([]);
  const [penerimaList, setPenerimaList] = useState([]); // Untuk Dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State untuk Form Tambah Menu
  const [namaMenu, setNamaMenu] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [idPenerima, setIdPenerima] = useState('');

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Mengambil data Menu & Penerima sekaligus saat halaman dimuat
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resMenu, resPenerima] = await Promise.all([
        fetch('http://localhost:5000/menu', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:5000/penerima', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const dataMenu = await resMenu.json();
      const dataPenerima = await resPenerima.json();

      if (resMenu.ok) setMenus(dataMenu.data || []);
      else if (resMenu.status === 401) navigate('/login');

      if (resPenerima.ok) setPenerimaList(dataPenerima.data || []);
    } catch (err) {
      setError('Gagal memuat data dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchData();
  }, [navigate, token]);

  // Fungsi Menambah Jadwal Menu
  const handleTambahMenu = async (e) => {
    e.preventDefault();
    if (!namaMenu.trim() || !tanggal || !idPenerima) return;

    try {
      const response = await fetch('http://localhost:5000/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_menu: namaMenu,
          tanggal: tanggal,
          id_penerima: parseInt(idPenerima)
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Kosongkan form dan refresh tabel
        setNamaMenu('');
        setTanggal('');
        setIdPenerima('');
        fetchData(); 
      } else {
        alert(data.pesan);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat menyimpan jadwal menu.');
    }
  };

  // Fungsi Menghapus Menu
  const handleHapusMenu = async (id_menu) => {
    const konfirmasi = window.confirm('Apakah Anda yakin ingin menghapus jadwal menu ini? (Data Purchase Order terkait menu ini mungkin akan terkendala).');
    if (!konfirmasi) return;

    try {
      const response = await fetch(`http://localhost:5000/menu/${id_menu}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setMenus(menus.filter(m => m.id_menu !== id_menu));
      } else {
        alert(data.pesan);
      }
    } catch (err) {
      alert('Gagal menghapus menu.');
    }
  };

  // Otorisasi: Misal Role 1 (Superadmin), 2 (KaSPPG), dan 3 (Ahli Gizi) bisa kelola menu
  const isAuthorized = role === '1' || role === '2' || role === '3';

  return (
    <Layout title="Manajemen Jadwal Menu">
      <div className="space-y-6">
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {/* --- FORM TAMBAH JADWAL MENU --- */}
        {isAuthorized && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-embege-primary mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-embege-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Jadwalkan Menu Baru
            </h3>
            
            <form onSubmit={handleTambahMenu} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Input Nama Menu */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Menu / Masakan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Nasi Goreng Spesial" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-embege-light focus:border-embege-primary outline-none transition-all"
                    value={namaMenu}
                    onChange={(e) => setNamaMenu(e.target.value)}
                    required
                  />
                </div>

                {/* Input Tanggal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Dimasak</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-embege-light focus:border-embege-primary outline-none transition-all text-gray-700"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                  />
                </div>

                {/* Dropdown Penerima Manfaat */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Distribusi (Penerima)</label>
                  <select 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-embege-light focus:border-embege-primary outline-none transition-all bg-white"
                    value={idPenerima}
                    onChange={(e) => setIdPenerima(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Pilih Panti / Penerima --</option>
                    {penerimaList.map(p => (
                      <option key={p.id_penerima} value={p.id_penerima}>
                        {p.nama_penerima} (B:{p.qty_porsi_besar} K:{p.qty_porsi_kecil})
                      </option>
                    ))}
                  </select>
                </div>

              </div>
              
              <div className="flex justify-end pt-3">
                <button 
                  type="submit" 
                  className="bg-embege-green hover:brightness-95 text-embege-primary font-bold py-2.5 px-8 rounded-lg transition duration-200 shadow-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- TABEL DAFTAR MENU --- */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-embege-light text-embege-primary border-b border-embege-primary/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">Tgl Jadwal</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">Nama Menu</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">Penerima</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wider">Porsi Besar</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wider">Porsi Kecil</th>
                {isAuthorized && (
                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider w-24">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 font-medium">Memuat jadwal menu...</td>
                </tr>
              ) : (!Array.isArray(menus) || menus.length === 0) ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Belum ada jadwal menu.
                  </td>
                </tr>
              ) : (
                menus.map((menu) => (
                  <tr key={menu.id_menu} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                      {new Date(menu.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-embege-primary">
                      {menu.nama_menu}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {menu.nama_penerima || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="bg-embege-light/30 text-embege-primary border border-embege-light py-1 px-3 rounded-md font-semibold text-xs">
                        {menu.qty_porsi_besar || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="bg-embege-light/30 text-embege-primary border border-embege-light py-1 px-3 rounded-md font-semibold text-xs">
                        {menu.qty_porsi_kecil || 0}
                      </span>
                    </td>
                    {isAuthorized && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button 
                          onClick={() => handleHapusMenu(menu.id_menu)}
                          className="text-white font-semibold bg-red-500 hover:bg-red-600 p-2 rounded-md transition duration-200 shadow-sm ml-auto"
                          title="Hapus Menu"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

export default Dashboard;