type PageLoadingStateProps = {
  label?: string
}

export function PageLoadingState({ label = 'Loading…' }: PageLoadingStateProps) {
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="page-loading__spinner" aria-hidden="true" />
      <p className="page-loading__label">{label}</p>
    </div>
  )
}
