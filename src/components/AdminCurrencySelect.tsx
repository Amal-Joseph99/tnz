import { useEffect, useId, useRef, useState } from 'react'

type AdminCurrencySelectProps = {
  value: string
  options: Array<{ currencyCode: string }>
  disabled?: boolean
  onChange: (currencyCode: string) => void
}

export function AdminCurrencySelect({ value, options, disabled = false, onChange }: AdminCurrencySelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div className="admin-currency-select" ref={rootRef}>
      <button
        type="button"
        className="admin-currency-select__trigger"
        disabled={disabled || options.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        {value || '—'}
      </button>

      {open ? (
        <ul id={listId} className="admin-currency-select__menu" role="listbox" aria-label="Display currency">
          {options.map((option) => (
            <li key={option.currencyCode}>
              <button
                type="button"
                role="option"
                aria-selected={option.currencyCode === value}
                className={option.currencyCode === value ? 'is-active' : undefined}
                onClick={() => {
                  onChange(option.currencyCode)
                  setOpen(false)
                }}
              >
                {option.currencyCode}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
