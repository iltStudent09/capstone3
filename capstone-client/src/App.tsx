import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import ClaimDetailPage from './pages/ClaimDetailPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import './App.css'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return <div className="auth-status">Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/claims/:id" element={<ClaimDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
