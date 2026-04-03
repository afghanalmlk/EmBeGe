// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Menu from './pages/Menu';
import Barang from './pages/Barang';
import Penerima from './pages/Penerima';
import PO from './pages/PO';
import Invoice from './pages/Invoice';
import Users from './pages/Users';
import Profile from './pages/Profile';
import SppgProfile from './pages/SppgProfile';
import Layout from './components/Layout'; // <-- INI YANG KURANG

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
        <Route path="/barang" element={<ProtectedRoute><Barang /></ProtectedRoute>} />
        <Route path="/penerima" element={<ProtectedRoute><Penerima /></ProtectedRoute>} />
        <Route path="/po" element={<ProtectedRoute><PO /></ProtectedRoute>} />
        <Route path="/invoice" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/sppg/profile" element={<ProtectedRoute><Layout title="Profil Unit Kerja"><SppgProfile /></Layout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;