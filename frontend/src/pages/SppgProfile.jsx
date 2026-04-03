const SppgProfile = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-500 uppercase">Nama Unit Kerja</label>
            <p className="text-lg font-bold text-gray-800">
              {localStorage.getItem('nama_sppg') || 'Belum Diatur'}
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-500 uppercase">Alamat Lengkap</label>
            <p className="text-md text-gray-700">
              {localStorage.getItem('alamat_sppg') || 'Alamat tidak tersedia.'}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  export default SppgProfile;