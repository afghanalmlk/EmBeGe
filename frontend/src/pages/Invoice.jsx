import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Invoice = () => {
  const [invoiceList, setInvoiceList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const fetchInvoice = async () => {
    try {
      const response = await fetch('http://localhost:5000/invoice', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        setInvoiceList(data.data || []);
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
    else fetchInvoice();
  }, [navigate, token]);

  // Fungsi Menghapus Invoice (Superadmin, Akuntan, KaSPPG)
  const handleHapusInvoice = async (id_invoice) => {
    const konfirmasi = window.confirm('Apakah Anda yakin ingin menghapus tagihan (Invoice) ini? Semua rincian di dalamnya akan ikut terhapus.');
    if (!konfirmasi) return;

    try {
      const response = await fetch(`http://localhost:5000/invoice/${id_invoice}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (response.ok) {
        setInvoiceList(invoiceList.filter(i => i.id_invoice !== id_invoice));
      } else {
        alert(data.pesan);
      }
    } catch (err) {
      alert('Gagal menghapus Invoice.');
    }
  };

  // Cek otorisasi untuk tombol hapus (Misal: Role 1 Superadmin, Role 2 KaSPPG, Role 4 Akuntan)
  // Sesuaikan ID Role ini dengan desain databasemu
  const isAuthorizedToDelete = role === '1' || role === '2' || role === '4';

  return (
    <Layout title="Invoice & Pembayaran">
      <div className="space-y-6">
        
        {/* HEADER AKSI */}
        <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-embege-primary">Daftar Tagihan Supplier</h3>
            <p className="text-sm text-gray-500 mt-1">Pantau total tagihan yang harus dibayarkan berdasarkan Purchase Order.</p>
          </div>
          {/* Tombol Buat Invoice diletakkan di sini untuk pengembangan selanjutnya */}
          <button className="bg-embege-green hover:brightness-95 text-embege-primary font-bold py-2.5 px-6 rounded-lg transition duration-200 shadow-md flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Catat Invoice Baru
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {/* TABEL DAFTAR INVOICE */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-embege-light text-embege-primary border-b border-embege-primary/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">No. Invoice</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">Tanggal & Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider">Terkait PO</th>
                <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider">Total Tagihan</th>
                {isAuthorizedToDelete && (
                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wider w-24">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium">Memuat data tagihan...</td>
                </tr>
              ) : (!Array.isArray(invoiceList) || invoiceList.length === 0) ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Belum ada data Invoice yang dicatat.
                  </td>
                </tr>
              ) : (
                invoiceList.map((inv) => (
                  <tr key={inv.id_invoice} className="hover:bg-gray-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-embege-primary">
                      #INV-{inv.id_invoice}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-800">
                        {new Date(inv.tanggal_invoice).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {inv.supplier}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                      <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-md border border-gray-200">
                        PO-{inv.id_po}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-extrabold text-embege-primary">
                      Rp {Number(inv.total_tagihan).toLocaleString('id-ID')}
                    </td>
                    {isAuthorizedToDelete && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button 
                          onClick={() => handleHapusInvoice(inv.id_invoice)}
                          className="text-white font-semibold bg-red-500 hover:bg-red-600 p-2 rounded-md transition duration-200 shadow-sm ml-auto"
                          title="Hapus Invoice"
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

export default Invoice;