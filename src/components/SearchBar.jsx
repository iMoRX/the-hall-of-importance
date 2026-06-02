import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Global search bar with Cmd+K shortcut support.
 */
export default function SearchBar({ query, onSearch, onClear, inputRef }) {
  const localRef = useRef(null);
  const ref = inputRef || localRef;

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        ref.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === ref.current) {
        onClear();
        ref.current?.blur();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClear, ref]);

  return (
    <div className="search-bar">
      <Search size={15} className="search-bar__icon" />
      <input
        ref={ref}
        type="text"
        className="search-bar__input"
        placeholder="Search notes…"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        id="global-search-input"
      />
      {query ? (
        <button
          className="search-bar__shortcut"
          onClick={onClear}
          style={{ cursor: 'pointer', pointerEvents: 'auto', border: 'none', background: 'none', color: 'var(--text-tertiary)' }}
        >
          <X size={12} />
        </button>
      ) : (
        <span className="search-bar__shortcut">⌘K</span>
      )}
    </div>
  );
}
