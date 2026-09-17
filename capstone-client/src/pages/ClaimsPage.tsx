import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

import api from '../api'
import type {
  ApiErrorResponse,
  Claim,
  ClaimStatus,
  PaginatedResponse,
  Policy,
  ResourceResponse,
} from '../types'
import { formatCurrency, formatDate, formatStatusLabel, getPolicySummary } from '../utils/format'
import PageContainer from '../components/layout/PageContainer'
import StatusBadge from '../components/dashboard/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import LoadingState from '../components/common/LoadingState'
import { formatNumberInput, parseNumberInput } from '../utils/format'

const pageSize = 5
const claimStatuses: ClaimStatus[] = ['submitted', 'under-review', 'approved', 'denied', 'closed']
const statusOptions: Array<'all' | ClaimStatus> = ['all', ...claimStatuses]

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ClaimStatus>('all')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState(1)
  const [form, setForm] = useState({
    policyId: '',
    description: '',
    incidentDate: '',
    amount: '',
  })

  const loadPolicies = async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Policy>>('/policies', {
        params: { page: 1, limit: 100 },
      })

      setPolicies(data.data)
      setForm((current) => ({
        ...current,
        policyId: current.policyId || data.data[0]?._id || '',
      }))
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.error || 'Failed to load policies')
      } else {
        setError('Failed to load policies')
      }
    }
  }

  const loadClaims = async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get<PaginatedResponse<Claim>>('/claims', {
        params: {
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      })

      setClaims(data.data)
      setPageCount(Math.max(1, data.pagination.pages))
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.error || 'Failed to load claims')
      } else {
        setError('Failed to load claims')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPolicies()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    void loadClaims()
  }, [page, search, statusFilter])

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.policyId) {
      setError('Select a policy before creating a claim.')
      return
    }

    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }

    if (!form.incidentDate) {
      setError('Incident date is required.')
      return
    }

    const amount = parseNumberInput(form.amount)

    if (Number.isNaN(amount) || amount < 0) {
      setError('Enter a valid claim amount.')
      return
    }

    try {
      await api.post<ResourceResponse<Claim>>('/claims', {
        policy: form.policyId,
        description: form.description,
        incidentDate: form.incidentDate,
        amount,
      })

      setForm({
        policyId: form.policyId,
        description: '',
        incidentDate: '',
        amount: '',
      })
      setShowForm(false)

      if (page !== 1) {
        setPage(1)
      } else {
        await loadClaims()
      }
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.error || 'Failed to create claim')
      } else {
        setError('Failed to create claim')
      }
    }
  }

  const handleDelete = async (claimId: string) => {
    if (!window.confirm('Delete this claim? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/claims/${claimId}`)

      if (claims.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await loadClaims()
      }
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.error || 'Failed to delete claim')
      } else {
        setError('Failed to delete claim')
      }
    }
  }

  const summaryText = useMemo(() => `Page ${page} of ${pageCount}`, [page, pageCount])

  return (
    <PageContainer
      title="Claims"
      subtitle="Search, filter, create, and review claims from a responsive list view."
    >
      <section className="toolbar card-panel">
        <div className="toolbar__filters">
          <label className="field">
            <span className="field__label">Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search claims, policies, or status"
            />
          </label>

          <label className="field">
            <span className="field__label">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | ClaimStatus)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All statuses' : formatStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="button" className="primary-button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? 'Close Form' : 'New Claim'}
        </button>
      </section>

      {showForm ? (
        <section className="card-panel form-panel">
          <div className="panel__header">
            <h2>New Claim</h2>
          </div>
          <div className="panel__divider" />

          <form className="stack-form" onSubmit={handleCreate}>
            <label className="field">
              <span className="field__label">Policy</span>
              <select
                value={form.policyId}
                onChange={(event) => setForm((current) => ({ ...current, policyId: event.target.value }))}
                required
              >
                <option value="" disabled>
                  Select a policy
                </option>
                {policies.map((policy) => (
                  <option key={policy._id} value={policy._id}>
                    {getPolicySummary(policy)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={4}
                placeholder="Describe the incident"
                required
              />
            </label>

            <div className="form-grid form-grid--three">
              <label className="field">
                <span className="field__label">Incident date</span>
                <input
                  type="date"
                  value={form.incidentDate}
                  onChange={(event) => setForm((current) => ({ ...current, incidentDate: event.target.value }))}
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Amount</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: formatNumberInput(event.target.value),
                    }))
                  }
                  placeholder="0"
                  required
                />
              </label>

              <div className="field field--hint">
                <span className="field__label">Status</span>
                <p>New claims start as Submitted.</p>
              </div>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="form-actions">
              <button type="submit" className="primary-button">
                Create Claim
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {loading ? <LoadingState message="Loading claims..." /> : null}

      {!loading && error ? (
        <EmptyState title="Unable to load claims" description={error} />
      ) : null}

      {!loading && !error && claims.length === 0 ? (
        <EmptyState
          title="No claims match your filters"
          description="Try clearing the search or changing the status filter."
        />
      ) : null}

      {!loading && !error && claims.length > 0 ? (
        <section className="card-panel">
          <div className="panel__header">
            <h2>All Claims</h2>
            <span className="panel__meta">{summaryText}</span>
          </div>
          <div className="panel__divider" />

          <div className="table-scroll">
            <table className="data-table data-table--claims">
              <thead>
                <tr>
                  <th scope="col">Claim number</th>
                  <th scope="col">Policy</th>
                  <th scope="col">Description</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col">Incident date</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim._id}>
                    <td>
                      <Link to={`/claims/${claim._id}`} className="table-link">
                        {claim.claimNumber}
                      </Link>
                    </td>
                    <td>{getPolicySummary(claim.policy)}</td>
                    <td>{claim.description}</td>
                    <td>{formatCurrency(claim.amount)}</td>
                    <td>
                      <StatusBadge status={claim.status} />
                    </td>
                    <td>{formatDate(claim.incidentDate)}</td>
                    <td>
                      <button type="button" className="text-button" onClick={() => void handleDelete(claim._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination" aria-label="Claims pagination">
            <button type="button" className="secondary-button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </button>
            <span className="pagination__label">{summaryText}</span>
            <button
              type="button"
              className="secondary-button"
              disabled={page === pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              Next
            </button>
          </div>
        </section>
      ) : null}
    </PageContainer>
  )
}
