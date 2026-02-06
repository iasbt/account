import { Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboard from './pages/entry/AdminDashboard'
import AdminLogin from './pages/entry/AdminLogin'
import UserHome from './pages/entry/UserHome'
import UserLogin from './pages/entry/UserLogin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<UserLogin />} />
      <Route path="/user/home" element={<UserHome />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  )
}
