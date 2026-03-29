import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const Users = () => {
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State untuk Form Tambah (Khusus KaSPPG)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    no_telp: '',
    id_role: ''
  });

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const fetchUsers = async () => {
    try {
      // Backend Anda kemungkinan punya endpoint GET /users
      const response = await fetch('http://localhost:5000/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setUserList(data.data || []);
      else if (response.status === 401) navigate('/login');
    } catch (err) {
      setError('Gagal memuat data pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchUsers();
  }, [navigate, token]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/users', { // Sesuai rute backend Anda
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.pesan);
        setFormData({ username: '', password: '', email: '', no_telp: '', id_role: '' });
        fetchUsers();
      } else {
        alert(data.pesan);
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem.');
    }
  };

  const getRoleName = (id) => {
    const roles = { 1: 'Superadmin', 2: 'KaSPPG', 3: 'Ahli Gizi', 4: 'Akuntan' };
    return roles[id] || 'User';
  };

  return (
    <Layout title="Manajemen Pengguna">
      <div className="space-y-6">
        
        {/* FORM TAMBAH USER (Hanya muncul untuk KaSPPG - Role 2) */}
        {role === '2' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-embege-primary mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-embege-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
              Tambah Pegawai Baru (Dapur Anda)
            </h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                type="text" placeholder="Username" required
                className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-embege-light"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
              <input 
                type="password" placeholder="Password" required
                className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-embege-light"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <select 
                required className="px-4 py-2 border rounded-lg outline-none bg-white"
                value={formData.id_role}
                onChange={(e) => setFormData({...formData, id_role: e.target.value})}
              >
                <option value="">-- Pilih Jabatan --</option>
                <option value="3">Ahli Gizi</option>
                <option value="4">Akuntan</option>
              </select>
              <input 
                type="email" placeholder="Email"
                className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-embege-light"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <input 
                type="text" placeholder="No. Telp"
                className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-embege-light"
                value={formData.no_telp}
                onChange={(e) => setFormData({...formData, no_telp: e.target.value})}
              />
              <button type="submit" className="bg-embege-green text-embege-primary font-bold rounded-lg hover:brightness-95 transition shadow-sm">
                Simpan Akun
              </button>
            </form>
          </div>
        )}

        {/* TABEL PENGGUNA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-embege-light/20 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-embege-primary">
              {role === '1' ? 'Daftar Seluruh Pengguna Sistem' : 'Daftar Pegawai SPPG'}
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-embege-light text-embege-primary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Jabatan</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Kontak</th>
                {role === '1' && <th className="px-6 py-3 text-left text-xs font-bold uppercase">Lokasi SPPG</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="4" className="p-10 text-center text-gray-400">Memuat...</td></tr>
              ) : userList.map(u => (
                <tr key={u.id_user} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-embege-primary">{u.username}</div>
                    <div className="text-xs text-gray-400">ID: #{u.id_user}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.id_role === 1 ? 'bg-embege-gold text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {getRoleName(u.id_role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{u.email}</div>
                    <div className="text-xs">{u.no_telp}</div>
                  </td>
                  {role === '1' && (
                    <td className="px-6 py-4 text-sm font-semibold text-embege-primary">
                      SPPG #{u.id_sppg}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Users;