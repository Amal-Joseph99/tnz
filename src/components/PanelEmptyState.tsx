type PanelEmptyStateProps = {
  title: string
  message?: string
}

export function PanelEmptyState({ title, message }: PanelEmptyStateProps) {
  return (
    <div className="panel-empty-state">
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
    </div>
  )
}
