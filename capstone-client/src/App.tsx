import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import ClaimDetailPage from './pages/ClaimDetailPage'
import ClaimsPage from './pages/ClaimsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PoliciesPage from './pages/PoliciesPage'
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
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="claims" element={<ClaimsPage />} />
          <Route path="claims/:id" element={<ClaimDetailPage />} />
          <Route path="policies" element={<PoliciesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
