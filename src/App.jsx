import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Menu } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './components/AuthProvider';
import { useNotes, useAllTags, useNoteCounts } from './hooks/useNotes';
import { useSpaces } from './hooks/useSpaces';
import { useSearch } from './hooks/useSearch';
import { useExpiryCheck } from './hooks/useExpiryCheck';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import NoteGrid from './components/NoteGrid';
import NoteEditor from './components/NoteEditor';
import SpaceEditor from './components/SpaceEditor';
import ReviewQueue from './components/ReviewQueue';
import QuickCapture from './components/QuickCapture';
import ConfirmDialog from './components/ConfirmDialog';

export default function App() {
  // --- Global state ---
  const [activeSpaceId, setActiveSpaceId] = useState(null); // null = "All"
  const [activeTag, setActiveTag] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals
  const [editorNote, setEditorNote] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitialBody, setEditorInitialBody] = useState('');
  const [editorInitialFiles, setEditorInitialFiles] = useState([]);
  const [spaceEditorData, setSpaceEditorData] = useState(null);
  const [spaceEditorOpen, setSpaceEditorOpen] = useState(false);
  const [reviewQueueOpen, setReviewQueueOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Drag & drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // --- Data hooks ---
  const { spaces, addSpace, updateSpace, deleteSpace } = useSpaces();
  const spaceIdForNotes = activeSpaceId === 'trash' ? null : activeSpaceId;
  const { notes, addNote, updateNote, deleteNote, restoreNote, permanentlyDelete, emptyTrash, togglePin, extendExpiry, keepForever } = useNotes(spaceIdForNotes, {
    includeDeleted: activeSpaceId === 'trash',
  });
  const trashNotes = useNotes(null, { includeDeleted: true });
  const allTags = useAllTags(activeSpaceId === 'trash' ? null : activeSpaceId);
  const noteCounts = useNoteCounts();
  const { query, results, search, clearSearch, searchRef } = useSearch();
  const { expiringSoon, expiringSoonCount } = useExpiryCheck();

  const { session } = useAuth();

  // --- Global drag & drop ---
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragOver(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      // Don't capture drops if the editor is already open
      if (editorOpen) return;

      const droppedFiles = Array.from(e.dataTransfer.files || []);
      const droppedText = e.dataTransfer.getData('text/plain');
      const droppedHtml = e.dataTransfer.getData('text/html');

      let body = '';
      let fileList = [];

      // If files were dropped
      if (droppedFiles.length > 0) {
        fileList = droppedFiles;
        // Check if any of them are images — use filename as hint
        const imageFiles = droppedFiles.filter((f) => f.type.startsWith('image/'));
        const nonImageFiles = droppedFiles.filter((f) => !f.type.startsWith('image/'));
        if (nonImageFiles.length === 0 && imageFiles.length > 0) {
          body = ''; // Just images, no body text needed
        }
      }

      // If text/HTML was dropped (e.g., from a browser)
      if (droppedHtml && !droppedFiles.length) {
        body = droppedHtml;
      } else if (droppedText && !droppedFiles.length) {
        // Wrap plain text in a paragraph
        body = `<p>${droppedText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      }

      // Open the note editor with pre-filled content
      setEditorNote(null);
      setEditorInitialBody(body);
      setEditorInitialFiles(fileList);
      setEditorOpen(true);
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [editorOpen]);

  // --- Global paste handler ---
  useEffect(() => {
    const handlePaste = (e) => {
      // Don't intercept if we're already in the editor or inside an input/textarea
      const activeEl = document.activeElement;
      const isInInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable ||
        activeEl.closest('.editor-content') ||
        activeEl.closest('.modal')
      );

      if (isInInput || editorOpen) return;

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const pastedFiles = Array.from(clipboardData.files || []);
      const pastedHtml = clipboardData.getData('text/html');
      const pastedText = clipboardData.getData('text/plain');

      // Only intercept if there's something useful
      if (!pastedFiles.length && !pastedText && !pastedHtml) return;

      e.preventDefault();

      let body = '';
      let fileList = [];

      if (pastedFiles.length > 0) {
        fileList = pastedFiles;
      }

      if (pastedHtml) {
        body = pastedHtml;
      } else if (pastedText) {
        body = `<p>${pastedText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
      }

      setEditorNote(null);
      setEditorInitialBody(body);
      setEditorInitialFiles(fileList);
      setEditorOpen(true);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [editorOpen]);

  // --- Filter notes by active tag and search ---
  const getDisplayNotes = useCallback(() => {
    if (activeSpaceId === 'trash') {
      return notes;
    }

    let displayed = results !== null ? results : notes;

    if (activeTag) {
      displayed = displayed.filter((n) => n.tags?.includes(activeTag));
    }

    return displayed;
  }, [notes, results, activeTag, activeSpaceId]);

  const displayedNotes = getDisplayNotes();

  // Enrich notes with file counts
  const [fileCountMap, setFileCountMap] = useState({});
  useEffect(() => {
    async function loadFileCounts() {
      if (!session?.user?.id || !displayedNotes.length) return;
      const counts = {};
      
      // Batch fetch file lists for displayed notes
      await Promise.all(
        displayedNotes.map(async (note) => {
          const { data } = await supabase.storage.from('files').list(`${session.user.id}/${note.id}`);
          if (data) {
            const validFiles = data.filter(f => f.name !== '.emptyFolderPlaceholder');
            counts[note.id] = validFiles.length;
          }
        })
      );
      setFileCountMap(counts);
    }
    loadFileCounts();
  }, [displayedNotes, session?.user?.id]);

  const enrichedNotes = displayedNotes.map((n) => ({
    ...n,
    fileCount: fileCountMap[n.id] || 0,
  }));

  // --- Get current view title ---
  const getViewTitle = () => {
    if (activeSpaceId === 'trash') return 'Trash';
    if (activeSpaceId) {
      const space = spaces.find((s) => s.id === activeSpaceId);
      return space?.name || 'Notes';
    }
    return 'All Notes';
  };

  // --- Handlers ---
  const handleNoteClick = (note) => {
    if (activeSpaceId === 'trash') return;
    setEditorNote(note);
    setEditorInitialBody('');
    setEditorInitialFiles([]);
    setEditorOpen(true);
  };

  const handleNewNote = () => {
    setEditorNote(null);
    setEditorInitialBody('');
    setEditorInitialFiles([]);
    setEditorOpen(true);
  };

  const handleSaveNote = async (noteData, existingId) => {
    if (existingId) {
      await updateNote(existingId, noteData);
      return existingId;
    } else {
      return await addNote(noteData);
    }
  };

  const handleDeleteNote = (noteId) => {
    setEditorOpen(false);
    setConfirmDialog({
      title: 'Delete Note',
      message: 'This note will be moved to trash. You can restore it within 7 days.',
      confirmLabel: 'Move to Trash',
      onConfirm: async () => {
        await deleteNote(noteId);
        setConfirmDialog(null);
      },
    });
  };

  const handleRestoreNote = async (noteId) => {
    await restoreNote(noteId);
  };

  const handlePermanentDelete = (noteId) => {
    setConfirmDialog({
      title: 'Permanently Delete',
      message: 'This note and its files will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Delete Forever',
      onConfirm: async () => {
        await permanentlyDelete(noteId);
        setConfirmDialog(null);
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmDialog({
      title: 'Empty Trash',
      message: 'All notes in trash will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Empty Trash',
      onConfirm: async () => {
        await emptyTrash();
        setConfirmDialog(null);
      },
    });
  };

  const handleSaveSpace = async (data, existingId) => {
    if (existingId) {
      await updateSpace(existingId, data);
    } else {
      await addSpace(data);
    }
  };

  const handleDeleteSpace = (spaceId) => {
    setSpaceEditorOpen(false);
    setConfirmDialog({
      title: 'Delete Space',
      message: 'This space and ALL its notes will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Delete Space',
      onConfirm: async () => {
        await deleteSpace(spaceId);
        if (activeSpaceId === spaceId) setActiveSpaceId(null);
        setConfirmDialog(null);
      },
    });
  };

  const handleSearch = (q) => {
    search(q, activeSpaceId === 'trash' ? null : activeSpaceId);
  };

  const handleSpaceSelect = (spaceId) => {
    setActiveSpaceId(spaceId);
    setActiveTag(null);
    clearSearch();
    setSidebarOpen(false);
  };

  // Trash count
  const trashCount = trashNotes.notes?.length || 0;

  return (
    <div className="app-layout">
      <Sidebar
        spaces={spaces}
        activeSpaceId={activeSpaceId}
        onSpaceSelect={handleSpaceSelect}
        allTags={allTags}
        activeTag={activeTag}
        onTagSelect={setActiveTag}
        noteCounts={noteCounts}
        expiringSoonCount={expiringSoonCount}
        onOpenReviewQueue={() => setReviewQueueOpen(true)}
        onOpenSpaceEditor={(space) => {
          setSpaceEditorData(space || null);
          setSpaceEditorOpen(true);
        }}
        trashCount={trashCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <div className="main__header">
          <div className="main__header-left">
            <button
              className="header__menu-btn"
              onClick={() => setSidebarOpen(true)}
              id="mobile-menu-btn"
            >
              <Menu size={20} />
            </button>
            <h1 className="main__header-title">{getViewTitle()}</h1>
            <span className="main__header-count">{enrichedNotes.length} notes</span>
          </div>
          <div className="main__header-right">
            <SearchBar
              query={query}
              onSearch={handleSearch}
              onClear={clearSearch}
              inputRef={searchRef}
            />
            <button
              className="btn btn--secondary btn--sm"
              style={{ marginLeft: 'var(--space-2)' }}
              onClick={async () => {
                const { supabase } = await import('./lib/supabase');
                await supabase.auth.signOut();
              }}
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="main__content">
          {/* Trash banner */}
          {activeSpaceId === 'trash' && enrichedNotes.length > 0 && (
            <div className="trash-banner">
              <span className="trash-banner__text">
                Notes in trash are automatically deleted after 7 days
              </span>
              <button className="btn btn--danger btn--sm" onClick={handleEmptyTrash}>
                Empty Trash
              </button>
            </div>
          )}

          {/* Trash view with restore/delete actions */}
          {activeSpaceId === 'trash' ? (
            enrichedNotes.length > 0 ? (
              <div className="note-grid">
                {enrichedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="note-card"
                    style={{ cursor: 'default' }}
                  >
                    <div className="note-card__header">
                      <h3 className="note-card__title">{note.title || 'Untitled'}</h3>
                    </div>
                    <div className="note-card__footer" style={{ gap: 'var(--space-2)' }}>
                      <button className="btn btn--secondary btn--sm" onClick={() => handleRestoreNote(note.id)}>
                        Restore
                      </button>
                      <button className="btn btn--danger btn--sm" onClick={() => handlePermanentDelete(note.id)}>
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3 className="empty-state__title">Trash is empty</h3>
                <p className="empty-state__text">Deleted notes will appear here</p>
              </div>
            )
          ) : (
            <NoteGrid
              notes={enrichedNotes}
              spaces={spaces}
              onNoteClick={handleNoteClick}
            />
          )}
        </div>
      </div>

      {/* Global drag & drop overlay */}
      {isDragOver && (
        <div className="drop-overlay" id="global-drop-overlay">
          <div className="drop-overlay__content">
            <div className="drop-overlay__icon">📥</div>
            <h2 className="drop-overlay__title">Drop to create a note</h2>
            <p className="drop-overlay__text">Drop files or text to quickly create a new note</p>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      {activeSpaceId !== 'trash' && (
        <QuickCapture onClick={handleNewNote} />
      )}

      {/* Note Editor Modal */}
      {editorOpen && (
        <NoteEditor
          note={editorNote}
          spaces={spaces}
          defaultSpaceId={activeSpaceId === 'trash' ? null : activeSpaceId}
          initialBody={editorInitialBody}
          initialFiles={editorInitialFiles}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
          onClose={() => {
            setEditorOpen(false);
            setEditorNote(null);
            setEditorInitialBody('');
            setEditorInitialFiles([]);
          }}
        />
      )}

      {/* Space Editor Modal */}
      {spaceEditorOpen && (
        <SpaceEditor
          space={spaceEditorData}
          onSave={handleSaveSpace}
          onDelete={handleDeleteSpace}
          onClose={() => {
            setSpaceEditorOpen(false);
            setSpaceEditorData(null);
          }}
        />
      )}

      {/* Review Queue */}
      {reviewQueueOpen && (
        <ReviewQueue
          notes={expiringSoon}
          onExtend={extendExpiry}
          onKeepForever={keepForever}
          onDelete={deleteNote}
          onClose={() => setReviewQueueOpen(false)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
