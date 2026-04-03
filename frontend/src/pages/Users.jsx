import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Layout from '../components/Layout';

const User = () => {
  const navigate = useNavigate();
  
  // State Data
  const [allUsers, setAllUsers] = useState([]);
  const [sppgList, setSppgList] = useState([]); // Khusus Superadmin
  
  // State UI
  const [selectedSppg, setSelectedSppg] = useState(null); // Mode "View Detail" untuk Superadmin
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    id_role: '3', // Default: Ahli Gizi
    kontak: ''
  });

  // Hak Akses (RBAC)
  const role = localStorage.getItem('role');
  const isSuperadmin = role === '1';
  const isKaSPPG = role === '2';

  // Jika bukan Superadmin atau KaSPPG, tendang ke halaman menu
  useEffect(() => {
    if (role === '3' || role === '4') {
      navigate('/menu');
    }
  }, [role, navigate]);

  // Fetch Data User
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users');
      const usersData = res.data.data || [];
      setAllUsers(usersData);

      // Jika Superadmin, kelompokkan user berdasarkan SPPG untuk membuat "Tabel SPPG"
      if (isSuperadmin) {
        const uniqueSppgs = [];
        const sppgMap = new Map();
        
        usersData.forEach(u => {
          if (u.id_sppg && !sppgMap.has(u.id_sppg)) {
            sppgMap.set(u.id_sppg, true);
            // Asumsi KaSPPG (Role 2) memegang data utama SPPG
            uniqueSppgs.push({
              id_sppg: u.id_sppg,
              nama_sppg: u.nama_sppg || `SPPG #${u.id_sppg}`,
              kontak: u.kontak || '-',
              alamat: u.alamat || '-'
            });
          }
        });
        setSppgList(uniqueSppgs);
      }
    } catch (err) {
      setError('Gagal memuat data User.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Fungsi Tambah User
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.id_role) {
      return alert("Username, Password, dan Jabatan wajib diisi!");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        id_role: parseInt(formData.id_role),
        no_telp: formData.kontak, // <--- Sesuaikan nama variabel dengan backend
        email: `${formData.username.replace(/\s/g, '').toLowerCase()}@sistem.com`, // <--- Email palsu default karena backend wajibkan email
        ...(isSuperadmin && selectedSppg ? { id_sppg: selectedSppg.id_sppg } : {})
      };

      // <--- PERBAIKAN: Gunakan /users (pakai s)
      await api.post('/users', payload); 
      
      alert('User baru berhasil ditambahkan!');
      setFormData({ username: '', password: '', id_role: '3', kontak: '' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.pesan || 'Terjadi kesalahan saat menambahkan user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi Hapus User
  const handleHapusUser = async (id_user, username) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${username}" secara permanen?`)) return;
    try {
      // <--- PERBAIKAN: Gunakan /users (pakai s)
      await api.delete(`/users/${id_user}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.pesan || 'Gagal menghapus user.');
    }
  };

  // Menentukan data user mana yang ditampilkan di tabel kanan
  const displayedUsers = isSuperadmin 
    ? (selectedSppg ? allUsers.filter(u => u.id_sppg === selectedSppg.id_sppg) : []) 
    : allUsers;

  return (
    <Layout title="Manajemen Akses & User">
      <div className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">{error}</div>}

        {/* ========================================================= */}
        {/* VIEW 1: TABEL SPPG (HANYA MUNCUL UNTUK SUPERADMIN DI AWAL) */}
        {/* ========================================================= */}
        {isSuperadmin && !selectedSppg && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-blue-50">
              <h3 className="text-lg font-bold text-blue-900">Daftar Panti / SPPG Terdaftar</h3>
              <p className="text-sm text-blue-700">Pilih salah satu SPPG untuk melihat dan mengelola akun karyawannya.</p>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nama SPPG</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Kontak</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Alamat</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500">Memuat data SPPG...</td></tr>
                ) : sppgList.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500">Belum ada SPPG yang terdaftar.</td></tr>
                ) : (
                  sppgList.map((sppg) => (
                    <tr key={sppg.id_sppg} className="hover:bg-blue-50 transition cursor-pointer" onClick={() => setSelectedSppg(sppg)}>
                      <td className="px-6 py-4 text-sm font-bold text-gray-800">{sppg.nama_sppg}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{sppg.kontak}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{sppg.alamat}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-blue-600 bg-blue-100 px-4 py-1.5 rounded-lg font-bold hover:bg-blue-200 transition">Lihat Tim &rarr;</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: FORM CRUD USER (MUNCUL UNTUK KASPPG ATAU SUPERADMIN YG SUDAH KLIK SPPG) */}
        {/* ========================================================= */}
        {(isKaSPPG || (isSuperadmin && selectedSppg)) && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Tombol Back Khusus Superadmin */}
            {isSuperadmin && (
              <button onClick={() => setSelectedSppg(null)} className="flex items-center gap-2 text-blue-700 font-bold hover:text-blue-900 transition bg-blue-50 px-4 py-2 rounded-lg w-fit">
                &larr; Kembali ke Daftar SPPG
              </button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KOLOM KIRI: FORM TAMBAH USER */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Buat Akun Baru</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    {isSuperadmin ? `Menambahkan staff untuk: ${selectedSppg?.nama_sppg}` : 'Tambahkan anggota tim (Ahli Gizi/Akuntan) ke SPPG Anda.'}
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Username / Nama Lengkap</label>
                      <input type="text" name="username" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.username} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Password</label>
                      <input type="password" name="password" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.password} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Pilih Jabatan (Role)</label>
                      <select name="id_role" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.id_role} onChange={handleChange}>
                        <option value="3">Ahli Gizi (Role 3)</option>
                        <option value="4">Akuntan (Role 4)</option>
                        {isSuperadmin && <option value="2">KaSPPG Baru (Role 2)</option>}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">Nomor Kontak (Opsional)</label>
                      <input type="text" name="kontak" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.kontak} onChange={handleChange} placeholder="08123xxxx" />
                    </div>
                    
                    <button type="submit" disabled={isSubmitting} className={`w-full font-bold py-3 rounded-lg text-white transition mt-4 ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}>
                      {isSubmitting ? 'Menyimpan...' : '+ Daftarkan Akun'}
                    </button>
                  </form>
                </div>
              </div>

              {/* KOLOM KANAN: TABEL DAFTAR USER */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">
                      Daftar Anggota Tim {isSuperadmin ? selectedSppg?.nama_sppg : ''}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Username</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Jabatan</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Kontak</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loading ? (
                          <tr><td colSpan="4" className="p-8 text-center text-gray-500">Memuat data user...</td></tr>
                        ) : displayedUsers.length === 0 ? (
                          <tr><td colSpan="4" className="p-8 text-center text-gray-500">Belum ada tim yang didaftarkan di SPPG ini.</td></tr>
                        ) : (
                          displayedUsers.map((user) => (
                            <tr key={user.id_user} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 text-sm font-bold text-gray-800">{user.username}</td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full 
                                  ${user.id_role === 2 ? 'bg-purple-100 text-purple-800' : 
                                    user.id_role === 3 ? 'bg-green-100 text-green-800' : 
                                    user.id_role === 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {user.nama_role || `Role ${user.id_role}`}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{user.kontak || '-'}</td>
                              <td className="px-6 py-4 text-center">
                                {/* Mencegah KaSPPG menghapus dirinya sendiri */}
                                {user.username !== localStorage.getItem('username') && (
                                  <button onClick={() => handleHapusUser(user.id_user, user.username)} className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-md font-bold text-xs transition">
                                    Hapus
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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

export default User;