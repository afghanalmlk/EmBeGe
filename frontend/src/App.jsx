import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Barang from './pages/Barang';
import Penerima from './pages/Penerima';
import PO from './pages/PO';
import Invoice from './pages/Invoice';
import Users from './pages/Users';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/barang" element={<Barang />} />
        <Route path="/penerima" element={<Penerima />} />
        <Route path="/po" element={<PO />} />
        <Route path="/invoice" element={<Invoice />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;