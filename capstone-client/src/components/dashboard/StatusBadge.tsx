import type { ClaimStatus, PolicyStatus } from '../../types'
import { formatStatusLabel } from '../../utils/format'

type BadgeStatus = ClaimStatus | PolicyStatus

const badgeClassMap: Record<BadgeStatus, string> = {
  submitted: 'status-badge--submitted',
  'under-review': 'status-badge--under-review',
  approved: 'status-badge--approved',
  denied: 'status-badge--denied',
  closed: 'status-badge--closed',
  active: 'status-badge--active',
  expired: 'status-badge--expired',
  cancelled: 'status-badge--cancelled',
}

interface StatusBadgeProps {
  status: BadgeStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`status-badge ${badgeClassMap[status]}`}
      aria-label={`Status: ${formatStatusLabel(status)}`}
    >
      {formatStatusLabel(status)}
    </span>
  )
}
