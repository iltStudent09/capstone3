import type { StatusCount } from '../../types'
import { formatStatusLabel, makeProgressWidth } from '../../utils/format'
import StatusBadge from './StatusBadge'

const statusOrder = ['under-review', 'approved', 'submitted', 'denied', 'closed'] as const

interface ClaimsByStatusProps {
  counts: StatusCount[]
}

export default function ClaimsByStatus({ counts }: ClaimsByStatusProps) {
  const orderedCounts = statusOrder.map((status) => ({
    status,
    count: counts.find((entry) => entry._id === status)?.count ?? 0,
  }))

  const maxCount = Math.max(...orderedCounts.map((entry) => entry.count), 1)

  return (
    <section className="panel card-panel">
      <div className="panel__header">
        <h2>Claims by Status</h2>
      </div>
      <div className="panel__divider" />

      <div className="status-list" role="list" aria-label="Claims by status summary">
        {orderedCounts.map((entry) => (
          <div key={entry.status} className="status-row" role="listitem">
            <div className="status-row__label">
              <StatusBadge status={entry.status} />
            </div>

            <div
              className="status-row__track"
              role="progressbar"
              aria-label={`${formatStatusLabel(entry.status)} claims`}
              aria-valuemin={0}
              aria-valuemax={maxCount}
              aria-valuenow={entry.count}
            >
              <div
                className={`status-row__fill status-row__fill--${entry.status}`}
                style={{ width: `${makeProgressWidth(entry.count, maxCount)}%` }}
              />
            </div>

            <strong className="status-row__count">{entry.count}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
