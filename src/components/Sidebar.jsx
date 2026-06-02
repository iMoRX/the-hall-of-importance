import React from 'react';
import {
  Layers, Trash2, AlertTriangle, Plus, Settings,
  GraduationCap, Briefcase, Heart, Home, Star,
  BookOpen, Code, Music, Plane, Dumbbell,
  Camera, ShoppingBag, Palette, Gamepad2, Stethoscope,
} from 'lucide-react';

const ICON_MAP = {
  GraduationCap, Briefcase, Heart, Home, Star,
  BookOpen, Code, Music, Plane, Dumbbell,
  Camera, ShoppingBag, Palette, Gamepad2, Stethoscope,
};

/**
 * Left sidebar with spaces, tags, expiry warnings, and trash.
 */
export default function Sidebar({
  spaces,
  activeSpaceId,
  onSpaceSelect,
  allTags,
  activeTag,
  onTagSelect,
  noteCounts,
  expiringSoonCount,
  onOpenReviewQueue,
  onOpenSpaceEditor,
  trashCount,
  isOpen,
  onClose,
}) {
  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div
              className="sidebar__logo"
              style={{
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: 'var(--font-md)',
              }}
            >
              H
            </div>
            <span className="sidebar__title">The Hall of<br />Importance</span>
          </div>
        </div>

        <nav className="sidebar__content">
          {/* Spaces */}
          <div className="sidebar__section">
            <div className="sidebar__section-label">Spaces</div>

            {/* All notes */}
            <button
              className={`sidebar__item ${activeSpaceId === null ? 'sidebar__item--active' : ''}`}
              onClick={() => onSpaceSelect(null)}
              id="sidebar-all-spaces"
            >
              <span className="sidebar__item-icon">
                <Layers size={16} />
              </span>
              <span className="sidebar__item-name">All Notes</span>
              <span className="sidebar__item-count">{noteCounts.all || 0}</span>
            </button>

            {/* Individual spaces */}
            {spaces.map((space) => {
              const IconComponent = ICON_MAP[space.icon] || Star;
              return (
                <div
                  key={space.id}
                  className="sidebar__item-row"
                >
                  <button
                    className={`sidebar__item ${activeSpaceId === space.id ? 'sidebar__item--active' : ''}`}
                    onClick={() => onSpaceSelect(space.id)}
                    id={`sidebar-space-${space.id}`}
                  >
                    <span className="sidebar__item-dot" style={{ backgroundColor: space.color }} />
                    <span className="sidebar__item-name">{space.name}</span>
                    <span className="sidebar__item-count">{noteCounts[space.id] || 0}</span>
                  </button>
                  <button
                    className="sidebar__item-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSpaceEditor(space);
                    }}
                    title={`Edit ${space.name}`}
                  >
                    <Settings size={13} />
                  </button>
                </div>
              );
            })}

            {/* Add space button */}
            <button
              className="sidebar__add-btn"
              onClick={() => onOpenSpaceEditor()}
              id="sidebar-add-space"
            >
              <Plus size={14} />
              <span>Add Space</span>
            </button>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="sidebar__section">
              <div className="sidebar__section-label">Tags</div>
              <div className="sidebar__tags">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-chip ${activeTag === tag ? 'tag-chip--active' : ''}`}
                    onClick={() => onTagSelect(activeTag === tag ? null : tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon */}
          {expiringSoonCount > 0 && (
            <div className="sidebar__section">
              <div className="sidebar__section-label">Alerts</div>
              <button
                className="sidebar__item"
                onClick={onOpenReviewQueue}
                id="sidebar-expiring-soon"
              >
                <span className="sidebar__item-icon" style={{ color: 'var(--warning)' }}>
                  <AlertTriangle size={16} />
                </span>
                <span className="sidebar__item-name">Expiring Soon</span>
                <span className="sidebar__item-count sidebar__item-count--warning">
                  {expiringSoonCount}
                </span>
              </button>
            </div>
          )}

          {/* Trash */}
          <div className="sidebar__section">
            <button
              className={`sidebar__item ${activeSpaceId === 'trash' ? 'sidebar__item--active' : ''}`}
              onClick={() => onSpaceSelect('trash')}
              id="sidebar-trash"
            >
              <span className="sidebar__item-icon">
                <Trash2 size={16} />
              </span>
              <span className="sidebar__item-name">Trash</span>
              {trashCount > 0 && (
                <span className="sidebar__item-count">{trashCount}</span>
              )}
            </button>
          </div>
        </nav>

        <div className="sidebar__footer" style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <button
            className="sidebar__item"
            style={{ color: 'var(--text-secondary)' }}
            onClick={async () => {
              const { supabase } = await import('../lib/supabase');
              await supabase.auth.signOut();
            }}
          >
            <span className="sidebar__item-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </span>
            <span className="sidebar__item-name">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
