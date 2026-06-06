import React, { useState, useEffect } from 'react';
import {
  X, Edit3, Trash2, Pin, PinOff, Clock, Tag, Folder,
  Paperclip, Download, FileText, Image as ImageIcon, File,
  ExternalLink,
} from 'lucide-react';
import ExpiryBadge from './ExpiryBadge';
import { formatDate, formatFileSize, getFileTypeCategory, stripHtml } from '../utils/helpers';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

/**
 * Read-only note display modal. Shows rendered note content, files, and metadata.
 * Provides actions: Edit, Delete, Pin/Unpin.
 */
export default function NoteDisplay({
  note,
  spaces,
  onEdit,
  onDelete,
  onClose,
  onTogglePin,
}) {
  const { session } = useAuth();
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Find the space this note belongs to
  const space = spaces.find((s) => s.id === note?.spaceId);

  // Load files for this note
  useEffect(() => {
    async function loadFiles() {
      if (!note?.id || !session?.user?.id) return;
      setLoadingFiles(true);
      const { data, error } = await supabase.storage
        .from('files')
        .list(`${session.user.id}/${note.id}`);
      if (!error && data) {
        const formatted = data
          .filter((f) => f.name !== '.emptyFolderPlaceholder')
          .map((f) => ({
            id: f.name,
            name: f.name,
            type: f.metadata?.mimetype || '',
            size: f.metadata?.size || 0,
          }));
        setFiles(formatted);
      }
      setLoadingFiles(false);
    }
    loadFiles();
  }, [note?.id, session?.user?.id]);

  const getFileIcon = (type) => {
    const cat = getFileTypeCategory(type);
    if (cat === 'image') return ImageIcon;
    if (cat === 'pdf' || cat === 'document') return FileText;
    return File;
  };

  const handleDownload = async (fileName) => {
    if (!note?.id || !session?.user?.id) return;
    const path = `${session.user.id}/${note.id}/${fileName}`;
    const { data, error } = await supabase.storage.from('files').download(path);
    if (!error && data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleViewFile = async (fileName, mimeType) => {
    if (!note?.id || !session?.user?.id) return;
    const path = `${session.user.id}/${note.id}/${fileName}`;
    const { data } = supabase.storage.from('files').getPublicUrl(path);
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  if (!note) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal note-display-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px' }}
      >
        {/* Header */}
        <div className="modal__header">
          <div className="note-display__header-meta">
            {space && (
              <span
                className="note-display__space-badge"
                style={{ '--badge-color': space.color }}
              >
                <Folder size={12} />
                {space.name}
              </span>
            )}
            <ExpiryBadge expiresAt={note.expiresAt} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="btn btn--icon btn--ghost"
              onClick={() => onTogglePin?.(note.id)}
              title={note.isPinned ? 'Unpin' : 'Pin'}
            >
              {note.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button
              type="button"
              className="btn btn--icon btn--ghost"
              onClick={() => onEdit(note)}
              title="Edit note"
              id="note-display-edit-btn"
            >
              <Edit3 size={16} />
            </button>
            <button className="modal__close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal__body note-display__body">
          {/* Title */}
          <h1 className="note-display__title">{note.title || 'Untitled'}</h1>

          {/* Date info */}
          <div className="note-display__dates">
            <span className="note-display__date">
              <Clock size={12} />
              Last updated {formatDate(note.updatedAt)}
            </span>
            {note.createdAt !== note.updatedAt && (
              <span className="note-display__date">
                Created {formatDate(note.createdAt)}
              </span>
            )}
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="note-display__tags">
              {note.tags.map((tag) => (
                <span key={tag} className="note-display__tag">
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div
            className="note-display__content"
            dangerouslySetInnerHTML={{ __html: note.body || '<p class="note-display__empty">No content</p>' }}
          />

          {/* Files */}
          {files.length > 0 && (
            <div className="note-display__files">
              <div className="note-display__files-header">
                <Paperclip size={14} />
                <span>{files.length} attachment{files.length > 1 ? 's' : ''}</span>
              </div>
              <div className="file-list">
                {files.map((f) => {
                  const FileIcon = getFileIcon(f.type);
                  const isImage = getFileTypeCategory(f.type) === 'image';
                  return (
                    <div key={f.id} className="file-item file-item--display">
                      <FileIcon size={18} className="file-item__icon" />
                      <div className="file-item__info">
                        <div className="file-item__name">{f.name}</div>
                        {f.size > 0 && (
                          <div className="file-item__size">{formatFileSize(f.size)}</div>
                        )}
                      </div>
                      <button
                        className="file-item__action"
                        onClick={() => handleDownload(f.name)}
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        className="file-item__action"
                        onClick={() => handleViewFile(f.name, f.type)}
                        title="Open in new tab"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loadingFiles && (
            <div className="note-display__loading">Loading attachments…</div>
          )}
        </div>

        {/* Footer */}
        <div className="modal__footer">
          {onDelete && (
            <button
              className="btn btn--danger"
              onClick={() => onDelete(note.id)}
              style={{ marginRight: 'auto' }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
          <button className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn--primary"
            onClick={() => onEdit(note)}
            id="note-display-edit-btn-footer"
          >
            <Edit3 size={14} />
            Edit Note
          </button>
        </div>
      </div>
    </div>
  );
}
