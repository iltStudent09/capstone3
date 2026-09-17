import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

import api from '../api'
import EmptyState from '../components/common/EmptyState'
import LoadingState from '../components/common/LoadingState'
import PageContainer from '../components/layout/PageContainer'
import StatusBadge from '../components/dashboard/StatusBadge'
import type { ApiErrorResponse, Claim, ResourceResponse } from '../types'
import { formatCurrency, formatDate, formatDateTime, getClaimNoteAuthorName, getPolicySummary } from '../utils/format'

export default function ClaimDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'submitted' | 'under-review' | 'approved' | 'denied' | 'closed'>('submitted')
  const [noteText, setNoteText] = useState('')
  const [message, setMessage] = useState('')

  const loadClaim = async () => {
    if (!id) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data } = await api.get<ResourceResponse<Claim>>(`/claims/${id}`)
      setClaim(data.data)
      setStatus(data.data.status)
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.error || 'Failed to load claim')
      } else {
        setError('Failed to load claim')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadClaim()
  }, [id])

  if (!id) {
    return <Navigate to="/claims" replace />
  }

  if (loading) {
    return (
      <PageContainer title="Claim detail" subtitle="Loading claim information.">
        <LoadingState message="Loading claim details..." />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer title="Claim detail" subtitle="Unable to load the selected claim.">
        <EmptyState title="Claim unavailable" description={error} />
      </PageContainer>
    )
  }

  if (!claim) {
    return (
      <PageContainer title="Claim detail" subtitle="The selected claim could not be found.">
        <EmptyState
          title="Claim not found"
          description="The claim may have been deleted or the link is no longer valid."
          action={
            <Link className="primary-button primary-button--link" to="/claims">
              Back to Claims
            </Link>
          }
        />
      </PageContainer>
    )
  }

  const handleStatusUpdate = async () => {
    try {
      await api.put(`/claims/${claim._id}`, { status })
      await loadClaim()
      setMessage('Claim status updated.')
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setMessage(err.response?.data.error || 'Failed to update claim status')
      } else {
        setMessage('Failed to update claim status')
      }
    }
  }

  const handleAddNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!noteText.trim()) {
      return
    }

    try {
      await api.post(`/claims/${claim._id}/notes`, { text: noteText })
      setNoteText('')
      await loadClaim()
      setMessage('Note added.')
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setMessage(err.response?.data.error || 'Failed to add note')
      } else {
        setMessage('Failed to add note')
      }
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Delete this claim? This action cannot be undone.')) {
      try {
        await api.delete(`/claims/${claim._id}`)
        navigate('/claims', { replace: true })
      } catch (err) {
        if (axios.isAxiosError<ApiErrorResponse>(err)) {
          setMessage(err.response?.data.error || 'Failed to delete claim')
        } else {
          setMessage('Failed to delete claim')
        }
      }
    }
  }

  return (
    <PageContainer title="Claim detail" subtitle="Review the full claim record, notes, and status workflow.">
      <section className="detail-grid">
        <article className="card-panel detail-card">
          <div className="detail-card__header">
            <div>
              <p className="detail-card__kicker">Claim number</p>
              <h2>{claim.claimNumber}</h2>
            </div>
            <StatusBadge status={claim.status} />
          </div>

          <div className="detail-summary">
            <div>
              <span className="detail-summary__label">Policy</span>
              <strong>{getPolicySummary(claim.policy)}</strong>
            </div>
            <div>
              <span className="detail-summary__label">Amount</span>
              <strong>{formatCurrency(claim.amount)}</strong>
            </div>
            <div>
              <span className="detail-summary__label">Incident date</span>
              <strong>{formatDate(claim.incidentDate)}</strong>
            </div>
            <div>
              <span className="detail-summary__label">Updated</span>
              <strong>{formatDateTime(claim.updatedAt)}</strong>
            </div>
          </div>

          <section className="detail-section">
            <h3>Description</h3>
            <p className="detail-copy">{claim.description}</p>
          </section>

          <section className="detail-section">
            <h3>Status update</h3>
            <div className="detail-actions">
              <label className="field field--inline">
                <span className="field__label">Status</span>
                <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                  <option value="submitted">Submitted</option>
                  <option value="under-review">Under-Review</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <button type="button" className="primary-button" onClick={handleStatusUpdate}>
                Update Status
              </button>
            </div>
            {message ? <p className="success-copy">{message}</p> : null}
          </section>
        </article>

        <article className="card-panel detail-card detail-card--stacked">
          <section className="detail-section">
            <div className="panel__header">
              <h2>Notes</h2>
            </div>
            <div className="panel__divider" />

            {claim.notes.length > 0 ? (
              <ul className="notes-list">
                {claim.notes.map((note) => (
                  <li key={note._id} className="note-item">
                    <div className="note-item__header">
                      <strong>{getClaimNoteAuthorName(note)}</strong>
                      <span>{formatDateTime(note.createdAt)}</span>
                    </div>
                    <p>{note.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="panel__empty">No notes have been added yet.</p>
            )}
          </section>

          <section className="detail-section">
            <h3>Add Note</h3>
            <form className="stack-form" onSubmit={handleAddNote}>
              <label className="field">
                <span className="field__label">New note</span>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder="Add a follow-up note"
                  rows={4}
                />
              </label>

              <div className="form-actions form-actions--split">
                <button type="submit" className="primary-button">
                  Add Note
                </button>
                <button type="button" className="danger-button" onClick={handleDelete}>
                  Delete Claim
                </button>
              </div>
            </form>
          </section>

          <section className="detail-section detail-section--meta">
            <h3>Record information</h3>
            <dl className="definition-list">
              <div>
                <dt>Claim ID</dt>
                <dd>{claim._id}</dd>
              </div>
              <div>
                <dt>Policy ID</dt>
                <dd>{typeof claim.policy === 'string' ? claim.policy : claim.policy._id}</dd>
              </div>
              <div>
                <dt>Notes count</dt>
                <dd>{claim.notes.length}</dd>
              </div>
            </dl>
          </section>
        </article>
      </section>
    </PageContainer>
  )
}