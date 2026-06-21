import { useMemo } from 'react'

type BulletPointEditorProps = {
  label: string
  value: string[]
  onChange: (bullets: string[]) => void
  maxBullets?: number
  maxTotalChars?: number
  disabled?: boolean
  placeholder?: string
  required?: boolean
}

function bulletsToText(bullets: string[]) {
  return bullets.join('\n')
}

function textToBullets(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter(Boolean)
}

export function BulletPointEditor({
  label,
  value,
  onChange,
  maxBullets = 50,
  maxTotalChars = 1500,
  disabled = false,
  placeholder = 'Press Enter for a new bullet point',
  required = false,
}: BulletPointEditorProps) {
  const textValue = useMemo(() => bulletsToText(value), [value])
  const totalChars = value.join('').length

  const handleChange = (nextText: string) => {
    const lines = nextText.split('\n')
    if (lines.length > maxBullets) return

    const bullets = textToBullets(nextText)
    if (bullets.join('').length > maxTotalChars) return

    onChange(bullets.length > 0 ? bullets : textToBullets(nextText))
  }

  return (
    <label className="listing-bullet-editor">
      <span className="listing-field-label">
        {label}
        {required ? ' *' : ''}
      </span>
      <textarea
        className="listing-bullet-editor__input"
        value={textValue}
        disabled={disabled}
        placeholder={placeholder}
        rows={6}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            const target = event.currentTarget
            const start = target.selectionStart
            const end = target.selectionEnd
            const next = `${target.value.slice(0, start)}\n${target.value.slice(end)}`
            handleChange(next)
            requestAnimationFrame(() => {
              target.selectionStart = target.selectionEnd = start + 1
            })
          }
        }}
      />
      <div className="listing-bullet-preview">
        {value.length === 0 ? (
          <p className="listing-bullet-preview__empty">Bullets will appear here as you type.</p>
        ) : (
          <ul>
            {value.map((bullet, index) => (
              <li key={`${bullet}-${index}`}>• {bullet}</li>
            ))}
          </ul>
        )}
      </div>
      <span className="listing-field-hint">
        {value.length} bullet{value.length === 1 ? '' : 's'} · {totalChars}/{maxTotalChars} characters
      </span>
    </label>
  )
}

export function parseBulletText(text: string) {
  return textToBullets(text)
}

export function serializeBullets(bullets: string[]) {
  return bulletsToText(bullets)
}
