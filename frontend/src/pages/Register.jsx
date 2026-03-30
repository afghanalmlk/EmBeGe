import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    no_telp: '',
    nama_sppg: '',
    provinsi: '',
    kabupaten_kota: '',
    kecamatan: '',
    kelurahan_desa: '',
    alamat: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      alert(response.data.pesan);
      navigate('/login'); // Arahkan ke login setelah sukses
    } catch (err) {
      setError(err.response?.data?.pesan || 'Gagal melakukan registrasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Daftar Akun SPPG</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-50">
            Masuk di sini
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
              {error}
            </div>
          )}
          
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informasi Akun */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Informasi Akun</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input name="username" type="text" required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input name="password" type="password" required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">No. Telepon</label>
                <input name="no_telp" type="text" onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
            </div>

            {/* Informasi SPPG */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Informasi SPPG / Dapur</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama SPPG</label>
                <input name="nama_sppg" type="text" required onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Provinsi</label>
                <input name="provinsi" type="text" onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kabupaten/Kota</label>
                <input name="kabupaten_kota" type="text" onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kecamatan</label>
                <input name="kecamatan" type="text" onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Alamat Lengkap SPPG</label>
              <textarea name="alamat" rows="3" onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
              >
                {loading ? 'Mendaftarkan...' : 'Daftar SPPG Baru'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;