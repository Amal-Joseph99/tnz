import { useEffect, useRef, useState } from 'react'

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

function normalizeBulletLine(line: string) {
  return line.replace(/^[•\-\*]\s*/, '')
}

function textToBullets(text: string) {
  return text
    .split('\n')
    .map((line) => normalizeBulletLine(line).trim())
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
  const [text, setText] = useState(() => bulletsToText(value))
  const skipExternalSync = useRef(false)
  const bullets = textToBullets(text)
  const totalChars = bullets.join('').length

  useEffect(() => {
    if (skipExternalSync.current) {
      skipExternalSync.current = false
      return
    }

    setText(bulletsToText(value))
  }, [value])

  const handleChange = (nextText: string) => {
    const nextBullets = textToBullets(nextText)
    if (nextBullets.length > maxBullets) return
    if (nextBullets.join('').length > maxTotalChars) return

    skipExternalSync.current = true
    setText(nextText)
    onChange(nextBullets)
  }

  return (
    <label className="listing-bullet-editor">
      <span className="listing-field-label">
        {label}
        {required ? ' *' : ''}
      </span>
      <textarea
        className="listing-bullet-editor__input"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        rows={6}
        onChange={(event) => handleChange(event.target.value)}
      />
      <div className="listing-bullet-preview">
        {bullets.length === 0 ? (
          <p className="listing-bullet-preview__empty">Bullets will appear here as you type.</p>
        ) : (
          <ul>
            {bullets.map((bullet, index) => (
              <li key={`${bullet}-${index}`}>{bullet}</li>
            ))}
          </ul>
        )}
      </div>
      <span className="listing-field-hint">
        {bullets.length} bullet{bullets.length === 1 ? '' : 's'} · {totalChars}/{maxTotalChars} characters
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
