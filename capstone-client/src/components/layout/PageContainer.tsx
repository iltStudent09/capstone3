import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function PageContainer({ title, subtitle, children }: PageContainerProps) {
  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="page-kicker">Policy Claims Tracker</p>
          <h1>{title}</h1>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
      </header>

      {children}
    </main>
  )
}
