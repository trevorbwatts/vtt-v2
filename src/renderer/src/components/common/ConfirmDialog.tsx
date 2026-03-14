import React from 'react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps): React.ReactElement | null {
  if (!open) return null
  return (
    <Modal open={open} onClose={onCancel} title={title} width="max-w-sm">
      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded text-sm transition-colors"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)'
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: danger ? 'var(--danger)' : 'var(--accent)',
            color: '#fff'
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
