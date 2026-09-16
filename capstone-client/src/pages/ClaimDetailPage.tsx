import { Link, useParams } from 'react-router-dom'

export default function ClaimDetailPage() {
  const { id } = useParams()

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <p className="dashboard-eyebrow">Claim details</p>
        <h1>Claim {id}</h1>
        <p className="dashboard-copy">
          This route is ready for the full claim detail view.
        </p>
        <Link to="/" className="inline-link">
          Back to dashboard
        </Link>
      </section>
    </main>
  )
}