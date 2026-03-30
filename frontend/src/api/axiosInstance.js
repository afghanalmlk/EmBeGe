// frontend/src/api/axiosInstance.js
import axios from 'axios';

// Membuat instance axios dengan konfigurasi dasar
const api = axios.create({
  // Mengambil URL dari .env (Vite menggunakan import.meta.env)
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR: Dijalankan SEBELUM request dikirim ke backend
api.interceptors.request.use(
  (config) => {
    // Ambil token dari brankas (localStorage)
    const token = localStorage.getItem('token');
    
    // Jika token ada, selipkan di header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Dijalankan SETELAH menerima balasan dari backend
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Jika backend membalas dengan status 401 (Unauthorized / Token Kadaluarsa)
    if (error.response && error.response.status === 401) {
      // Bersihkan semua sisa data login di browser
      localStorage.clear();
      // Tendang paksa user kembali ke halaman login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;