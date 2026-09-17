import { Link } from 'react-router-dom'

import type { Claim } from '../../types'
import { formatCurrency, getPolicySummary } from '../../utils/format'
import StatusBadge from './StatusBadge'

interface RecentClaimsProps {
  claims: Claim[]
}

export default function RecentClaims({ claims }: RecentClaimsProps) {
  return (
    <section className="panel card-panel">
      <div className="panel__header">
        <h2>Recent Claims</h2>
      </div>
      <div className="panel__divider" />

      {claims.length > 0 ? (
        <div className="table-scroll" aria-label="Recent claims table">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Claim #</th>
                <th scope="col">Policy</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
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
                  <td>{formatCurrency(claim.amount)}</td>
                  <td>
                    <StatusBadge status={claim.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="panel__empty">No recent claims are available.</p>
      )}
    </section>
  )
}
