import { Outlet } from 'react-router-dom'

import Navbar from './Navbar'

export default function AppShell() {
  return (
    <div className="app-shell">
      <Navbar />
      <Outlet />
    </div>
  )
}
