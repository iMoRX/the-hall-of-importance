import React from 'react';
import NoteCard from './NoteCard';
import { FileText } from 'lucide-react';

/**
 * Responsive grid of note cards with empty state.
 */
export default function NoteGrid({ notes, spaces, onNoteClick }) {
  // Build a quick lookup for space colors
  const spaceColorMap = {};
  spaces.forEach((s) => {
    spaceColorMap[s.id] = s.color;
  });

  if (!notes || notes.length === 0) {
    return (
      <div className="empty-state">
        <FileText size={56} className="empty-state__icon" />
        <h3 className="empty-state__title">No notes yet</h3>
        <p className="empty-state__text">
          Hit the <strong>+</strong> button to create your first note, or use <strong>⌘K</strong> to search.
        </p>
      </div>
    );
  }

  return (
    <div className="note-grid">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          spaceColor={spaceColorMap[note.spaceId]}
          onClick={onNoteClick}
        />
      ))}
    </div>
  );
}
