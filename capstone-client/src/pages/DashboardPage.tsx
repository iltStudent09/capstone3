import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Authenticated session</p>
            <h1>Welcome, {user?.name ?? 'User'}</h1>
            <p className="dashboard-copy">
              You are signed in as {user?.email}.
            </p>
          </div>

          <button type="button" className="secondary-button" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="dashboard-grid">
          <article>
            <h2>Role</h2>
            <p>{user?.role}</p>
          </article>
          <article>
            <h2>Next steps</h2>
            <p>Build policy, claim, and dashboard views on top of this auth flow.</p>
          </article>
        </div>

        <Link to="/login" className="inline-link">
          Return to login
        </Link>
      </section>
    </main>
  )
}