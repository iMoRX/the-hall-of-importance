import React from 'react';
import { Pin, Paperclip } from 'lucide-react';
import ExpiryBadge from './ExpiryBadge';
import { stripHtml, formatDate } from '../utils/helpers';

/**
 * Individual note card with glassmorphism effect.
 */
export default function NoteCard({ note, spaceColor, onClick }) {
  const bodyPreview = stripHtml(note.body);

  return (
    <div
      className={`note-card ${note.isPinned ? 'note-card--pinned' : ''}`}
      onClick={() => onClick(note)}
      style={{ '--card-accent': spaceColor || 'var(--accent)' }}
      id={`note-card-${note.id}`}
    >
      {/* Top accent bar via CSS ::before - set color dynamically */}
      <style>{`
        #note-card-${note.id}::before {
          background: linear-gradient(90deg, ${spaceColor || 'var(--accent)'}, ${spaceColor || 'var(--accent-hover)'});
        }
      `}</style>

      <div className="note-card__header">
        <h3 className="note-card__title">{note.title || 'Untitled'}</h3>
        {note.isPinned && <Pin size={14} className="note-card__pin" />}
      </div>

      {bodyPreview && (
        <p className="note-card__body">{bodyPreview}</p>
      )}

      {note.fileCount > 0 && (
        <div className="note-card__files">
          <Paperclip size={12} />
          <span>{note.fileCount} file{note.fileCount > 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="note-card__footer">
        <div className="note-card__tags">
          {note.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="note-card__tag">#{tag}</span>
          ))}
          {note.tags?.length > 3 && (
            <span className="note-card__tag">+{note.tags.length - 3}</span>
          )}
        </div>

        <ExpiryBadge expiresAt={note.expiresAt} />

        <span className="note-card__date">{formatDate(note.updatedAt)}</span>
      </div>
    </div>
  );
}
