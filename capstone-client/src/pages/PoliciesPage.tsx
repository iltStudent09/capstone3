import { useEffect, useMemo, useState, type FormEvent } from 'react'
import axios from 'axios'

import api from '../api'
import type {
  ApiErrorResponse,
  PaginatedResponse,
  Policy,
  PolicyStatus,
  PolicyType,
  ResourceResponse,
} from '../types'
import { formatCurrency, formatDate, formatStatusLabel } from '../utils/format'
import PageContainer from '../components/layout/PageContainer'
import StatusBadge from '../components/dashboard/StatusBadge'
import EmptyState from '../components/common/EmptyState'
import LoadingState from '../components/common/LoadingState'

const pageSize = 5
const policyTypes: Array<'all' | PolicyType> = ['all', 'auto', 'home', 'life']
const policyStatusOptions: PolicyStatus[] = ['active', 'expired', 'cancelled']

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | PolicyType>('all')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState(1)
  const [form, setForm] = useState({
    policyNumber: '',
    holderName: '',
    type: 'auto' as PolicyType,
    premium: '',
    status: 'active' as PolicyStatus,
    effectiveDate: '',
    expirationDate: '',
  })

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter])

  const loadPolicies = async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get<PaginatedResponse<Policy>>('/policies', {
        params: {
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          type: typeFilter === 'all' ? undefined : typeFilter,
        },
      })

      setPolicies(data.data)
      setPageCount(Math.max(1, data.pagination.pages))
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.error || 'Failed to load policies')
      } else {
        setError('Failed to load policies')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPolicies()
  }, [page, search, typeFilter])

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.policyNumber.trim()) {
      setError('Policy number is required.')
      return
    }

    if (!form.holderName.trim()) {
      setError('Holder name is required.')
      return
    }

    if (!form.effectiveDate || !form.expirationDate) {
      setError('Effective and expiration dates are required.')
      return
    }

    const premium = Number(form.premium)

    if (Number.isNaN(premium) || premium < 0) {
      setError('Enter a valid premium amount.')
      return
    }

    try {
      await api.post<ResourceResponse<Policy>>('/policies', {
        policyNumber: form.policyNumber,
        holderName: form.holderName,
        type: form.type,
        premium,
        status: form.status,
        effectiveDate: form.effectiveDate,
        expirationDate: form.expirationDate,
      })

      setForm({
        policyNumber: '',
        holderName: '',
        type: 'auto',
        premium: '',
        status: 'active',
        effectiveDate: '',
        expirationDate: '',
      })
      setShowForm(false)

      if (page !== 1) {
        setPage(1)
      } else {
        await loadPolicies()
      }
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.error || 'Failed to create policy')
      } else {
        setError('Failed to create policy')
      }
    }
  }

  const handleDelete = async (policyId: string) => {
    if (!window.confirm('Delete this policy? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/policies/${policyId}`)

      if (policies.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await loadPolicies()
      }
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.error || 'Failed to delete policy')
      } else {
        setError('Failed to delete policy')
      }
    }
  }

  const summaryText = useMemo(() => `Page ${page} of ${pageCount}`, [page, pageCount])

  return (
    <PageContainer
      title="Policies"
      subtitle="Review policies, filter by type, and add new policy records inline."
    >
      <section className="toolbar card-panel">
        <div className="toolbar__filters">
          <label className="field">
            <span className="field__label">Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search policies or holders"
            />
          </label>

          <label className="field">
            <span className="field__label">Type</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | PolicyType)}>
              {policyTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All types' : formatStatusLabel(type)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="button" className="primary-button" onClick={() => setShowForm((current) => !current)}>
          {showForm ? 'Close Form' : 'New Policy'}
        </button>
      </section>

      {showForm ? (
        <section className="card-panel form-panel">
          <div className="panel__header">
            <h2>New Policy</h2>
          </div>
          <div className="panel__divider" />

          <form className="stack-form" onSubmit={handleCreate}>
            <div className="form-grid form-grid--two">
              <label className="field">
                <span className="field__label">Policy number</span>
                <input
                  type="text"
                  value={form.policyNumber}
                  onChange={(event) => setForm((current) => ({ ...current, policyNumber: event.target.value }))}
                  placeholder="POL-AUTO-007"
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Holder name</span>
                <input
                  type="text"
                  value={form.holderName}
                  onChange={(event) => setForm((current) => ({ ...current, holderName: event.target.value }))}
                  placeholder="Holder name"
                  required
                />
              </label>
            </div>

            <div className="form-grid form-grid--three">
              <label className="field">
                <span className="field__label">Type</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as PolicyType }))}
                >
                  <option value="auto">Auto</option>
                  <option value="home">Home</option>
                  <option value="life">Life</option>
                </select>
              </label>

              <label className="field">
                <span className="field__label">Premium</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.premium}
                  onChange={(event) => setForm((current) => ({ ...current, premium: event.target.value }))}
                  placeholder="0"
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PolicyStatus }))}
                >
                  {policyStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-grid form-grid--two">
              <label className="field">
                <span className="field__label">Effective date</span>
                <input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(event) => setForm((current) => ({ ...current, effectiveDate: event.target.value }))}
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Expiration date</span>
                <input
                  type="date"
                  value={form.expirationDate}
                  onChange={(event) => setForm((current) => ({ ...current, expirationDate: event.target.value }))}
                  required
                />
              </label>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="form-actions">
              <button type="submit" className="primary-button">
                Create Policy
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {loading ? <LoadingState message="Loading policies..." /> : null}

      {!loading && error ? (
        <EmptyState title="Unable to load policies" description={error} />
      ) : null}

      {!loading && !error && policies.length === 0 ? (
        <EmptyState
          title="No policies match your filters"
          description="Try clearing the search or choosing a different type."
        />
      ) : null}

      {!loading && !error && policies.length > 0 ? (
        <section className="card-panel">
          <div className="panel__header">
            <h2>All Policies</h2>
            <span className="panel__meta">{summaryText}</span>
          </div>
          <div className="panel__divider" />

          <div className="table-scroll">
            <table className="data-table data-table--policies">
              <thead>
                <tr>
                  <th scope="col">Policy number</th>
                  <th scope="col">Holder</th>
                  <th scope="col">Type</th>
                  <th scope="col">Premium</th>
                  <th scope="col">Status</th>
                  <th scope="col">Effective</th>
                  <th scope="col">Expiration</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy._id}>
                    <td>{policy.policyNumber}</td>
                    <td>{policy.holderName}</td>
                    <td>{formatStatusLabel(policy.type)}</td>
                    <td>{formatCurrency(policy.premium)}</td>
                    <td>
                      <StatusBadge status={policy.status} />
                    </td>
                    <td>{formatDate(policy.effectiveDate)}</td>
                    <td>{formatDate(policy.expirationDate)}</td>
                    <td>
                      <button type="button" className="text-button" onClick={() => void handleDelete(policy._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination" aria-label="Policies pagination">
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
