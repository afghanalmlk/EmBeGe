import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Penerima = () => {
  const [penerimaList, setPenerimaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State untuk Form Tambah
  const [namaPenerima, setNamaPenerima] = useState('');
  const [alamat, setAlamat] = useState('');
  const [porsiBesar, setPorsiBesar] = useState(0);
  const [porsiKecil, setPorsiKecil] = useState(0);

  const navigate = useNavigate();
  const role = localStorage.getItem('role'); 
  const token = localStorage.getItem('token');

  const fetchPenerima = async () => {
    try {
      const response = await fetch('http://localhost:5000/penerima', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        setPenerimaList(data.data || []);
      } else {
        setError(data.pesan);
        if (response.status === 401) navigate('/login');
      }
    } catch (err) {
      setError('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchPenerima();
  }, [navigate, token]);

  const handleTambahPenerima = async (e) => {
    e.preventDefault();
    if (!namaPenerima.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/penerima', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          nama_penerima: namaPenerima,
          alamat: alamat,
          qty_porsi_besar: porsiBesar,
          qty_porsi_kecil: porsiKecil
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setNamaPenerima('');
        setAlamat('');
        setPorsiBesar(0);
        setPorsiKecil(0);
        fetchPenerima(); 
      } else {
        alert(data.pesan);
      }
    } catch (err) {
      alert('Gagal menambah penerima manfaat.');
    }
  };

  const handleHapusPenerima = async (id_penerima) => {
    const konfirmasi = window.confirm('Hapus penerima ini? Data jadwal menu yang terhubung mungkin akan ikut terhapus!');
    if (!konfirmasi) return;

    try {
      const response = await fetch(`http://localhost:5000/penerima/${id_penerima}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setPenerimaList(penerimaList.filter(p => p.id_penerima !== id_penerima));
      } else {
        alert(data.pesan);
      }
    } catch (err) {
      alert('Gagal menghapus penerima.');
    }
  };

  const isAuthorized = role === '1' || role === '2';

  return (
    <Layout title="Penerima Manfaat">
      <div className="space-y-6">
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {/* FORM TAMBAH PENERIMA */}
        {isAuthorized && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-embege-primary mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-embege-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              Registrasi Penerima Baru
            </h3>
            
            <form onSubmit={handleTambahPenerima} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Penerima</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Panti Asuhan Harapan" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-embege-light focus:border-embege-primary outline-none transition-all"
                    value={namaPenerima}
                    onChange={(e) => setNamaPenerima(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Jl. Merdeka No. 10" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-embege-light focus:border-embege-primary outline-none transition-all"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Porsi Besar</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-embege-light focus:border-embege-primary outline-none transition-all"
                    value={porsiBesar}
                    onChange={(e) => setPorsiBesar(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Porsi Kecil</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-embege-light focus:border-embege-primary outline-none transition-all"
                    value={porsiKecil}
                    onChange={(e) => setPorsiKecil(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-3">
                <button 
                  type="submit" 
                  className="bg-embege-green hover:brightness-95 text-embege-primary font-bold py-2.5 px-8 rounded-lg transition duration-200 shadow-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Simpan Penerima
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABEL DAFTAR PENERIMA */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-embege-light text-embege-primary border-b border-embege-primary/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">Nama & Alamat</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wider">Porsi Besar</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wider">Porsi Kecil</th>
                {isAuthorized && (
                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider w-32">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 font-medium">Memuat data dari server...</td>
                </tr>
              ) : (!Array.isArray(penerimaList) || penerimaList.length === 0) ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    Belum ada data penerima.
                  </td>
                </tr>
              ) : (
                penerimaList.map((p) => (
                  <tr key={p.id_penerima} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-embege-primary">{p.nama_penerima}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{p.alamat || 'Alamat tidak diisi'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="bg-embege-light/30 text-embege-primary border border-embege-light py-1 px-3 rounded-md font-semibold text-xs">
                        {p.qty_porsi_besar}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="bg-embege-light/30 text-embege-primary border border-embege-light py-1 px-3 rounded-md font-semibold text-xs">
                        {p.qty_porsi_kecil}
                      </span>
                    </td>
                    {isAuthorized && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button 
                          onClick={() => handleHapusPenerima(p.id_penerima)}
                          className="text-white font-semibold bg-red-500 hover:bg-red-600 py-1.5 px-3 rounded-md transition duration-200 flex items-center justify-center gap-1.5 ml-auto shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Hapus
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

export default Penerima;