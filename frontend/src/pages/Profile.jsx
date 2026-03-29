import { useState } from 'react';
import Layout from '../components/Layout';

const Profile = () => {
  const [email, setEmail] = useState('user@example.com'); // Data awal bisa dari state/API
  const [phone, setPhone] = useState('08123456789');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateContact = (e) => {
    e.preventDefault();
    alert('Informasi kontak berhasil diperbarui!');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert('Konfirmasi password tidak cocok!');
    alert('Password berhasil diubah!');
  };

  return (
    <Layout title="Pengaturan Profil">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* KARTU IDENTITAS UTAMA */}
        <div className="bg-embege-primary text-white p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-8 border-b-4 border-embege-gold">
          <div className="w-24 h-24 rounded-full bg-embege-gold flex items-center justify-center text-embege-primary font-black text-4xl shadow-lg border-4 border-white/20">
            {localStorage.getItem('username')?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-black tracking-tight">{localStorage.getItem('username')}</h3>
            <p className="text-embege-light font-bold flex items-center justify-center md:justify-start gap-2 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a7.11 7.11 0 00-1.322-4.043 7.107 7.107 0 00-1.678-1.678A7.11 7.11 0 006 9a7 7 0 00-7 7c0 .34.024.673.07 1h12.86zM11 17h.17c.046-.327.07-.66.07-1a7.11 7.11 0 011.322-4.043 7.107 7.107 0 011.678-1.678A7.11 7.11 0 0117 9a7 7 0 017 7c0 .34-.024.673-.07 1H11z" /></svg>
              {localStorage.getItem('role') === '1' ? 'Superadmin System' : 'Kepala SPPG'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FORM KONTAK */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h4 className="text-lg font-bold text-embege-primary mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Informasi Kontak
            </h4>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alamat Email</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-embege-light outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nomor Telepon</label>
                <input 
                  type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-embege-light outline-none transition"
                />
              </div>
              <button type="submit" className="w-full bg-embege-green text-embege-primary font-black py-2.5 rounded-lg shadow-sm hover:brightness-95 transition">
                Simpan Perubahan
              </button>
            </form>
          </div>

          {/* FORM PASSWORD */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h4 className="text-lg font-bold text-embege-primary mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Keamanan Akun
            </h4>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input 
                type="password" placeholder="Password Lama" required
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-embege-light outline-none transition"
                value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
              />
              <input 
                type="password" placeholder="Password Baru" required
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-embege-light outline-none transition"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              />
              <input 
                type="password" placeholder="Konfirmasi Password Baru" required
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-embege-light outline-none transition"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="submit" className="w-full bg-embege-primary text-white font-black py-2.5 rounded-lg shadow-sm hover:bg-[#132a5e] transition">
                Ganti Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;