import React from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  autoFocus
}: SearchInputProps): React.ReactElement {
  return (
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      >
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-8 pr-3 py-2 rounded text-sm outline-none transition-colors"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)'
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}
