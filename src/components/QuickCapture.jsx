import React from 'react';
import { Plus, ClipboardPaste } from 'lucide-react';

/**
 * Floating action buttons for quick note capture and pasting.
 */
export default function QuickCapture({ onClick, onPasteClick }) {
  return (
    <div className="fab-container">
      <button className="fab fab-secondary" onClick={onPasteClick} title="Paste to new note">
        <ClipboardPaste size={20} />
      </button>
      <button className="fab" onClick={onClick} title="Add new note" id="quick-capture-fab">
        <Plus size={26} />
      </button>
    </div>
  );
}
