import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

import api from '../api'
import { useAuth } from '../context/AuthContext'
import type { ApiErrorResponse, Claim, DashboardResponse, StatusCount } from '../types'

const STATUS_ORDER = ['submitted', 'under-review', 'approved', 'denied', 'closed'] as const

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)

const formatStatusLabel = (status: string) =>
  status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const getPolicySummary = (claim: Claim) => {
  if (typeof claim.policy === 'string') {
    return claim.policy
  }

  return `${claim.policy.policyNumber} · ${claim.policy.holderName}`
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [dashboard, setDashboard] = useState<DashboardResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const { data } = await api.get<DashboardResponse>('/dashboard')
        setDashboard(data.data)
      } catch (err) {
        if (axios.isAxiosError<ApiErrorResponse>(err)) {
          setError(err.response?.data.error || 'Failed to load dashboard')
        } else {
          setError('Failed to load dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const statusData = useMemo(() => {
    const statusMap = new Map<string, number>()

    dashboard?.claimsByStatus.forEach((item: StatusCount) => {
      statusMap.set(item._id, item.count)
    })

    return STATUS_ORDER.map((status) => ({
      status,
      count: statusMap.get(status) ?? 0,
    }))
  }, [dashboard])

  const maxStatusCount = Math.max(...statusData.map((item) => item.count), 1)

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

        {loading ? <div className="auth-status-inline">Loading dashboard...</div> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        {dashboard ? (
          <>
            <div className="stats-grid">
              <article className="stat-card">
                <p className="stat-label">Total claims</p>
                <strong>{dashboard.totalClaims}</strong>
              </article>
              <article className="stat-card">
                <p className="stat-label">Total policies</p>
                <strong>{dashboard.totalPolicies}</strong>
              </article>
              <article className="stat-card">
                <p className="stat-label">Total users</p>
                <strong>{dashboard.totalUsers}</strong>
              </article>
              <article className="stat-card">
                <p className="stat-label">Claim amount</p>
                <strong>{formatCurrency(dashboard.totalClaimAmount)}</strong>
              </article>
            </div>

            <div className="dashboard-panels">
              <section className="dashboard-panel">
                <div className="panel-header">
                  <h2>Claims by status</h2>
                  <span>{dashboard.totalClaims} total</span>
                </div>

                <div className="status-chart">
                  {statusData.map((item) => (
                    <div key={item.status} className="status-row">
                      <div className="status-meta">
                        <span>{formatStatusLabel(item.status)}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="status-bar-track" aria-hidden="true">
                        <div
                          className="status-bar-fill"
                          style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="dashboard-panel">
                <div className="panel-header">
                  <h2>Recent claims</h2>
                  <span>Last 5 entries</span>
                </div>

                <div className="table-wrap">
                  <table className="claims-table">
                    <thead>
                      <tr>
                        <th>Claim</th>
                        <th>Policy</th>
                        <th>Status</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentClaims.map((claim) => (
                        <tr key={claim._id}>
                          <td>
                            <Link to={`/claims/${claim._id}`} className="table-link">
                              {claim.claimNumber}
                            </Link>
                          </td>
                          <td>{getPolicySummary(claim)}</td>
                          <td>{formatStatusLabel(claim.status)}</td>
                          <td>{formatCurrency(claim.amount ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="dashboard-footer">
              <p className="dashboard-copy">Signed in as {user?.role}.</p>
              <Link to="/login" className="inline-link">
                Return to login
              </Link>
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}