import React from 'react';
import { X, Clock, ShieldCheck, Trash2, CalendarPlus } from 'lucide-react';
import ExpiryBadge from './ExpiryBadge';
import { EXPIRY_PRESETS } from '../utils/constants';
import { getExpiryDate } from '../utils/helpers';

/**
 * Slide-out review queue panel for notes expiring soon.
 */
export default function ReviewQueue({ notes, onExtend, onKeepForever, onDelete, onClose }) {
  if (!notes || notes.length === 0) {
    return (
      <div className="review-queue">
        <div className="review-queue__header">
          <h2 className="review-queue__title">Expiring Soon</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="review-queue__list">
          <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
            <ShieldCheck size={40} className="empty-state__icon" />
            <h3 className="empty-state__title">All clear!</h3>
            <p className="empty-state__text">No notes are expiring soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-queue">
      <div className="review-queue__header">
        <h2 className="review-queue__title">
          ⚠ Expiring Soon ({notes.length})
        </h2>
        <button className="modal__close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="review-queue__list">
        {notes.map((note) => (
          <div key={note.id} className="review-queue__item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="review-queue__item-title">{note.title || 'Untitled'}</h3>
              <ExpiryBadge expiresAt={note.expiresAt} />
            </div>
            <div className="review-queue__item-actions">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => onExtend(note.id, getExpiryDate(7))}
                title="Extend by 1 week"
              >
                <CalendarPlus size={12} />
                +1 Week
              </button>
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => onKeepForever(note.id)}
                title="Remove expiry"
              >
                <ShieldCheck size={12} />
                Keep Forever
              </button>
              <button
                className="btn btn--danger btn--sm"
                onClick={() => onDelete(note.id)}
                title="Delete now"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
