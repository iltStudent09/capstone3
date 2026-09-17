import { useEffect, useState } from 'react'
import axios from 'axios'

import api from '../api'
import { useAuth } from '../context/AuthContext'
import type { ApiErrorResponse, DashboardResponse } from '../types'
import { formatCurrency } from '../utils/format'
import ClaimsByStatus from '../components/dashboard/ClaimsByStatus'
import EmptyState from '../components/common/EmptyState'
import LoadingState from '../components/common/LoadingState'
import RecentClaims from '../components/dashboard/RecentClaims'
import PageContainer from '../components/layout/PageContainer'
import StatCard from '../components/dashboard/StatCard'

export default function DashboardPage() {
  const { loading: authLoading } = useAuth()
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

    if (!authLoading) {
      void loadDashboard()
    }
  }, [authLoading])

  return (
    <PageContainer
      title="Dashboard"
      subtitle="A quick overview of claims, policies, users, and the most recent claim activity."
    >
      {loading || authLoading ? <LoadingState message="Loading dashboard data..." /> : null}

      {!loading && error ? (
        <EmptyState title="Unable to load dashboard" description={error} />
      ) : null}

      {!loading && !error && dashboard && dashboard.totalClaims === 0 ? (
        <EmptyState
          title="No claims yet"
          description="Create your first claim from the Claims page to populate the dashboard."
        />
      ) : null}

      {!loading && !error && dashboard ? (
        <>
          <section className="stats-grid" aria-label="Summary statistics">
            <StatCard label="TOTAL CLAIMS" value={dashboard.totalClaims} />
            <StatCard label="TOTAL POLICIES" value={dashboard.totalPolicies} />
            <StatCard label="TOTAL USERS" value={dashboard.totalUsers} />
            <StatCard label="TOTAL CLAIM AMOUNT" value={formatCurrency(dashboard.totalClaimAmount)} />
          </section>

          <section className="dashboard-grid">
            <ClaimsByStatus counts={dashboard.claimsByStatus} />
            <RecentClaims claims={dashboard.recentClaims} />
          </section>
        </>
      ) : null}
    </PageContainer>
  )
}