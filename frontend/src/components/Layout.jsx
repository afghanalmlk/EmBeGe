import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react'; // <-- TAMBAHKAN INI
import axiosInstance from '../api/axiosInstance'; // <-- TAMBAHKAN INI

const Layout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const [sppgList, setSppgList] = useState([]);

  useEffect(() => {
    if (role === '1') { // Jika Superadmin
      const fetchSppg = async () => {
        try {
          const response = await axiosInstance.get('/sppg');
          setSppgList(response.data);
        } catch (error) {
          console.error("Gagal mengambil data SPPG", error);
        }
      };
      fetchSppg();
    }
  }, [role]);

  const handleSppgChange = (e) => {
    const selectedId = e.target.value;
    const selectedSppg = sppgList.find(s => s.id_sppg == selectedId);
    
    if (selectedSppg) {
      localStorage.setItem('id_sppg', selectedSppg.id_sppg);
      localStorage.setItem('nama_sppg', selectedSppg.nama_sppg);
      localStorage.setItem('alamat_sppg', selectedSppg.alamat);
      window.location.reload(); 
    }
  };

  const handleLogout = () => {
    localStorage.clear(); // <-- Jauh lebih aman dan efektif
    navigate('/login');
  };

  // Daftar Menu menggunakan Ikon SVG profesional, bukan emoji
  const navItems = [
    { 
      name: 'Daftar Menu', 
      path: '/menu',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      )
    },
    { 
      name: 'Master Barang', 
      path: '/barang',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
      )
    },
    { 
      name: 'Penerima Manfaat', 
      path: '/penerima',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      )
    },
    { 
      name: 'Purchase Order', 
      path: '/po',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    },
    { 
      name: 'Invoice', 
      path: '/invoice',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    },
    { 
        name: 'User Management', 
        path: '/users', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        )
      },
  ];

  return (
    <div className="flex h-screen font-sans text-gray-800">
      
      {/* SIDEBAR - Menggunakan warna Primary #071e49 */}
      <div className="w-64 bg-embege-primary text-white flex flex-col shadow-xl z-10">
        
        {/* LOGO AREA - Ikon dan Tipografi Premium */}
        <div className="p-6 flex items-center justify-center gap-3 border-b border-[#132a5e]">
          {/* Ikon Kubus/ERP Modular - Warna menyesuaikan teks (currentColor) */}
          <svg 
            className="w-9 h-9 text-embege-gold" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          
          {/* Teks Logo dengan Font Montserrat */}
          <span 
            className="text-3xl font-black tracking-wide text-embege-gold" 
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
          {navItems.map((item) => {
            if (item.name === 'User Management' && role !== '1' && role !== '2') return null;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                // Penambahan flex dan gap agar ikon dan teks sejajar rapi
                className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 font-medium ${
                  isActive  
                    ? 'bg-embege-light text-embege-primary shadow-md font-bold' 
                    : 'text-gray-300 hover:bg-[#132a5e] hover:text-white'        
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* PROFIL & LOGOUT AREA - Bagian Bawah Sidebar */}
        <div className="p-4 border-t border-[#132a5e] bg-[#051636]">
          {/* Info Profil Singkat */}
          <Link to="/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#132a5e] transition-all mb-3 group">
            <div className="w-10 h-10 rounded-full bg-embege-gold flex items-center justify-center text-embege-primary font-black text-xl shadow-inner">
              {localStorage.getItem('username')?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{localStorage.getItem('username') || 'User'}</p>
              <p className="text-[10px] font-medium text-embege-gold uppercase tracking-wider">
                {role === '1' ? 'Superadmin' : role === '2' ? 'KaSPPG' : role === '3' ? 'Ahli Gizi' : 'Akuntan'}
              </p>
            </div>
          </Link>

          {/* Info SPPG (Jika ada di localStorage) */}
          <div className="px-2 mb-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Unit Kerja</p>
            
            {role === '1' ? (
              // Tampilan Dropdown untuk Superadmin
              <select 
                className="w-full bg-[#132a5e] text-xs text-embege-light font-medium p-1.5 rounded border border-gray-600 focus:outline-none focus:border-embege-gold cursor-pointer"
                onChange={handleSppgChange}
                value={localStorage.getItem('id_sppg') || ''}
              >
                <option value="" disabled>-- Pilih Lingkungan SPPG --</option>
                {sppgList.map(sppg => (
                  <option key={sppg.id_sppg} value={sppg.id_sppg}>
                    {sppg.nama_sppg}
                  </option>
                ))}
              </select>
            ) : (
              // Tampilan Dinamis Clickable untuk user biasa
              <Link 
                to="/sppg/profile" 
                className="block hover:bg-[#132a5e] p-1.5 rounded transition-all -ml-1.5 cursor-pointer"
                title="Lihat Profil SPPG"
              >
                <p className="text-xs text-embege-light font-medium truncate">
                  {localStorage.getItem('nama_sppg') || 'SPPG Belum Diatur'}
                </p>
                <p className="text-[9px] text-gray-400 leading-tight mt-1 line-clamp-2">
                  {localStorage.getItem('alamat_sppg') || 'Alamat tidak tersedia'}
                </p>
              </Link>
            )}
          </div>

          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition duration-200 shadow-md flex justify-center items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f4f7f6]">
        
        {/* HEADER */}
        <header className="flex items-center justify-between p-6 bg-white border-b border-gray-200 shadow-sm z-0">
          <h2 className="text-2xl font-bold text-embege-primary">{title}</h2>
        </header>

        {/* DYNAMIC CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;