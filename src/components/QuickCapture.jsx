import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Floating action button for quick note capture.
 */
export default function QuickCapture({ onClick }) {
  return (
    <button className="fab" onClick={onClick} title="Add new note" id="quick-capture-fab">
      <Plus size={26} />
    </button>
  );
}
