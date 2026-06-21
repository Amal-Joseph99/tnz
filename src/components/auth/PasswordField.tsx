import { useId, useState } from 'react'
import { EyeIcon } from '../Icons'

type PasswordFieldProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  id?: string
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-4.1 5.2" />
      <path d="M6.1 6.1A18.5 18.5 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.9-1.2" />
    </svg>
  )
}

export function PasswordField({
  label = 'Password',
  value,
  onChange,
  placeholder = 'Enter your password',
  autoComplete = 'current-password',
  required = false,
  minLength,
  id,
}: PasswordFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)

  return (
    <label className="auth-field" htmlFor={inputId}>
      <span className="auth-field__label">{label}</span>
      <div className="auth-field__password">
        <input
          id={inputId}
          value={value}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="auth-field__toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  )
}
