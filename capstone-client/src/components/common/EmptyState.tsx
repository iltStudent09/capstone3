import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="state state--empty">
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className="state__action">{action}</div> : null}
    </div>
  )
}
