import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  X, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link as LinkIcon, Minus, Pin, PinOff,
  Upload, Trash2, FileText, Image as ImageIcon, File,
} from 'lucide-react';
import { EXPIRY_PRESETS, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '../utils/constants';
import { getExpiryDate, formatDateForInput, parseTags, formatFileSize, getFileTypeCategory } from '../utils/helpers';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

/**
 * Note editor modal with TipTap rich text, file uploads, tags, and expiry.
 */
export default function NoteEditor({
  note,
  spaces,
  defaultSpaceId,
  initialBody,
  initialFiles,
  onSave,
  onDelete,
  onClose,
}) {
  const isEditing = !!note;
  const { session } = useAuth();

  const [title, setTitle] = useState(note?.title || '');
  const [spaceId, setSpaceId] = useState(note?.spaceId || defaultSpaceId || spaces[0]?.id);
  const [tagString, setTagString] = useState(note?.tags?.join(', ') || '');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [expiryPreset, setExpiryPreset] = useState(null);
  const [customExpiry, setCustomExpiry] = useState(note?.expiresAt ? formatDateForInput(note.expiresAt) : '');
  const [files, setFiles] = useState(initialFiles || []);
  const [existingFiles, setExistingFiles] = useState([]);
  const [removedFileIds, setRemovedFileIds] = useState([]);
  const fileInputRef = useRef(null);

  // Load existing files if editing
  useEffect(() => {
    async function loadFiles() {
      if (note?.id && session?.user?.id) {
        const { data, error } = await supabase.storage
          .from('files')
          .list(`${session.user.id}/${note.id}`);
        if (!error && data) {
          // Format storage objects to match expected file structure
          const formatted = data.map(f => ({
            id: f.name, // using name as id since it's unique per folder
            name: f.name,
            type: f.metadata?.mimetype || '',
            size: f.metadata?.size || 0
          })).filter(f => f.name !== '.emptyFolderPlaceholder');
          setExistingFiles(formatted);
        }
      }
    }
    loadFiles();
  }, [note?.id, session?.user?.id]);

  // Determine initial expiry preset
  useEffect(() => {
    if (note?.expiresAt) {
      setExpiryPreset('custom');
    } else if (note && !note.expiresAt) {
      setExpiryPreset('never');
    }
  }, [note]);

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: 'Write your note… (supports rich text)',
      }),
    ],
    content: note?.body || initialBody || '',
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
  });

  // Handle save
  const handleSave = useCallback(async () => {
    const body = editor?.getHTML() || '';
    const tags = parseTags(tagString);

    let expiresAt = null;
    if (expiryPreset === 'custom' && customExpiry) {
      expiresAt = new Date(customExpiry).toISOString();
    } else if (expiryPreset && expiryPreset !== 'never' && expiryPreset !== 'custom') {
      const preset = EXPIRY_PRESETS.find((p) => p.label === expiryPreset);
      if (preset?.days) {
        expiresAt = getExpiryDate(preset.days);
      }
    }

    const noteData = {
      title: title.trim() || 'Untitled',
      body,
      spaceId,
      tags,
      isPinned,
      expiresAt,
    };

    // Save the note and get back its ID
    const noteId = await onSave(noteData, note?.id);
    const savedNoteId = noteId || note?.id;

    // Handle file uploads for the saved note
    if (savedNoteId && session?.user?.id) {
      // Remove files
      for (const fileName of removedFileIds) {
        await supabase.storage.from('files').remove([`${session.user.id}/${savedNoteId}/${fileName}`]);
      }

      // Add new files
      for (const file of files) {
        await supabase.storage.from('files').upload(
          `${session.user.id}/${savedNoteId}/${file.name}`,
          file,
          { upsert: true }
        );
      }
    }

    onClose();
  }, [editor, title, spaceId, tagString, isPinned, expiryPreset, customExpiry, files, removedFileIds, note, onSave, onClose]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        alert(`File "${f.name}" is too large. Maximum size is 50MB.`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeNewFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId) => {
    setRemovedFileIds((prev) => [...prev, fileId]);
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Toolbar button helper
  const ToolBtn = ({ onClick, isActive, icon: Icon, title: btnTitle }) => (
    <button
      type="button"
      className={`editor-toolbar__btn ${isActive ? 'editor-toolbar__btn--active' : ''}`}
      onClick={onClick}
      title={btnTitle}
    >
      <Icon size={15} />
    </button>
  );

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const getFileIcon = (type) => {
    const cat = getFileTypeCategory(type);
    if (cat === 'image') return ImageIcon;
    if (cat === 'pdf' || cat === 'document') return FileText;
    return File;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal__header">
          <h2 className="modal__title">{isEditing ? 'Edit Note' : 'New Note'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`btn btn--icon btn--ghost`}
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button className="modal__close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal__body">
          {/* Title */}
          <div className="field">
            <label className="field__label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title…"
              autoFocus
              id="note-title-input"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="field">
            <label className="field__label">Content</label>
            <div className="editor-wrapper">
              {editor && (
                <div className="editor-toolbar">
                  <ToolBtn
                    icon={Bold}
                    isActive={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                  />
                  <ToolBtn
                    icon={Italic}
                    isActive={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic"
                  />
                  <ToolBtn
                    icon={UnderlineIcon}
                    isActive={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Underline"
                  />
                  <ToolBtn
                    icon={Strikethrough}
                    isActive={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Strikethrough"
                  />

                  <div className="editor-toolbar__divider" />

                  <ToolBtn
                    icon={Heading1}
                    isActive={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    title="Heading 1"
                  />
                  <ToolBtn
                    icon={Heading2}
                    isActive={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Heading 2"
                  />
                  <ToolBtn
                    icon={Heading3}
                    isActive={editor.isActive('heading', { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    title="Heading 3"
                  />

                  <div className="editor-toolbar__divider" />

                  <ToolBtn
                    icon={List}
                    isActive={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Bullet List"
                  />
                  <ToolBtn
                    icon={ListOrdered}
                    isActive={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Ordered List"
                  />
                  <ToolBtn
                    icon={Quote}
                    isActive={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    title="Blockquote"
                  />
                  <ToolBtn
                    icon={Code}
                    isActive={editor.isActive('codeBlock')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    title="Code Block"
                  />

                  <div className="editor-toolbar__divider" />

                  <ToolBtn
                    icon={LinkIcon}
                    isActive={editor.isActive('link')}
                    onClick={addLink}
                    title="Add Link"
                  />
                  <ToolBtn
                    icon={Minus}
                    isActive={false}
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Rule"
                  />
                </div>
              )}
              <div className="editor-content">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Space & Tags row */}
          <div className="field__row">
            <div className="field">
              <label className="field__label">Space</label>
              <select
                value={spaceId}
                onChange={(e) => setSpaceId(Number(e.target.value))}
                id="note-space-select"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Tags</label>
              <input
                type="text"
                value={tagString}
                onChange={(e) => setTagString(e.target.value)}
                placeholder="tag1, tag2, tag3…"
                id="note-tags-input"
              />
            </div>
          </div>

          {/* Expiry */}
          <div className="field">
            <label className="field__label">Expires</label>
            <div className="expiry-presets">
              {EXPIRY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`expiry-preset ${
                    (expiryPreset === preset.label) ||
                    (preset.days === null && expiryPreset === 'never')
                      ? 'expiry-preset--active' : ''
                  }`}
                  onClick={() => {
                    if (preset.days === null) {
                      setExpiryPreset('never');
                      setCustomExpiry('');
                    } else {
                      setExpiryPreset(preset.label);
                      setCustomExpiry('');
                    }
                  }}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                className={`expiry-preset ${expiryPreset === 'custom' ? 'expiry-preset--active' : ''}`}
                onClick={() => setExpiryPreset('custom')}
              >
                Custom
              </button>
            </div>
            {expiryPreset === 'custom' && (
              <input
                type="datetime-local"
                value={customExpiry}
                onChange={(e) => setCustomExpiry(e.target.value)}
                style={{ marginTop: 'var(--space-2)' }}
                id="note-custom-expiry"
              />
            )}
          </div>

          {/* File Uploads */}
          <div className="field">
            <label className="field__label">Attachments</label>
            <div
              className="file-upload-area"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '';
                const dropped = Array.from(e.dataTransfer.files);
                const valid = dropped.filter((f) => f.size <= MAX_FILE_SIZE);
                setFiles((prev) => [...prev, ...valid]);
              }}
            >
              <Upload size={20} style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }} />
              <p className="file-upload-area__text">
                <strong>Click to upload</strong> or drag and drop
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES.join(',')}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {/* Existing files */}
            {existingFiles.length > 0 && (
              <div className="file-list" style={{ marginTop: 'var(--space-2)' }}>
                {existingFiles.map((f) => {
                  const FileIcon = getFileIcon(f.type);
                  return (
                    <div key={f.id} className="file-item">
                      <FileIcon size={18} className="file-item__icon" />
                      <div className="file-item__info">
                        <div className="file-item__name">{f.name}</div>
                        <div className="file-item__size">{formatFileSize(f.size)}</div>
                      </div>
                      <button className="file-item__remove" onClick={() => removeExistingFile(f.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* New files */}
            {files.length > 0 && (
              <div className="file-list" style={{ marginTop: 'var(--space-2)' }}>
                {files.map((f, i) => {
                  const FileIcon = getFileIcon(f.type);
                  return (
                    <div key={i} className="file-item">
                      <FileIcon size={18} className="file-item__icon" />
                      <div className="file-item__info">
                        <div className="file-item__name">{f.name}</div>
                        <div className="file-item__size">{formatFileSize(f.size)}</div>
                      </div>
                      <button className="file-item__remove" onClick={() => removeNewFile(i)}>
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal__footer">
          {isEditing && onDelete && (
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
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSave} id="note-save-btn">
            {isEditing ? 'Save Changes' : 'Create Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
