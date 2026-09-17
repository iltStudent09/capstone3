import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { formatStatusLabel } from '../../utils/format'

const ShieldIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="navbar__icon"
    focusable="false"
  >
    <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm0 4.2 4.8 1.8v3.9c0 3.2-2.1 6.2-4.8 7.5-2.7-1.3-4.8-4.3-4.8-7.5V8L12 6.2Z" />
  </svg>
)

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    window.alert('You have been logged out.')
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <ShieldIcon />
        <span>Policy Claims Tracker</span>
      </div>

      <nav className="navbar__nav" aria-label="Primary">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `navbar__link${isActive ? ' navbar__link--active' : ''}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/claims"
          className={({ isActive }) =>
            `navbar__link${isActive ? ' navbar__link--active' : ''}`
          }
        >
          Claims
        </NavLink>
        <NavLink
          to="/policies"
          className={({ isActive }) =>
            `navbar__link${isActive ? ' navbar__link--active' : ''}`
          }
        >
          Policies
        </NavLink>
      </nav>

      <div className="navbar__user">
        <div className="navbar__identity">
          <span className="navbar__name">{user?.name ?? 'Guest'}</span>
          <span className="navbar__badge">{formatStatusLabel(user?.role ?? 'adjuster')}</span>
        </div>
        <button type="button" className="navbar__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
