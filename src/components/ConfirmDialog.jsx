import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable confirmation dialog for destructive actions.
 */
export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {danger && <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />}
            {title || 'Confirm'}
          </h2>
          <button className="modal__close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">
          <p className="confirm-dialog__message">{message}</p>
        </div>
        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
