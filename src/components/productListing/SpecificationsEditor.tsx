type SpecificationRow = {
  attributeName: string
  attributeValue: string
}

type SpecificationsEditorProps = {
  rows: SpecificationRow[]
  onChange: (rows: SpecificationRow[]) => void
  disabled?: boolean
}

const emptyRow = (): SpecificationRow => ({ attributeName: '', attributeValue: '' })

export function SpecificationsEditor({ rows, onChange, disabled = false }: SpecificationsEditorProps) {
  const updateRow = (index: number, patch: Partial<SpecificationRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <section className="listing-specs">
      <div className="listing-section-head">
        <h3>Specifications</h3>
        <p>Add product specifications as name/value pairs.</p>
      </div>
      <div className="listing-specs-table">
        <div className="listing-specs-table__row listing-specs-table__row--head">
          <span>Specification</span>
          <span>Value</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div className="listing-specs-table__row" key={`spec-${index}`}>
            <input
              value={row.attributeName}
              disabled={disabled}
              placeholder="Weight"
              onChange={(event) => updateRow(index, { attributeName: event.target.value })}
            />
            <input
              value={row.attributeValue}
              disabled={disabled}
              placeholder="100g"
              onChange={(event) => updateRow(index, { attributeValue: event.target.value })}
            />
            <button
              type="button"
              className="listing-icon-btn"
              disabled={disabled || rows.length === 1}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              aria-label="Delete specification row"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {!disabled && (
        <button type="button" className="seller-secondary-action" onClick={() => onChange([...rows, emptyRow()])}>
          + Add row
        </button>
      )}
    </section>
  )
}

export { emptyRow as emptySpecificationRow }
