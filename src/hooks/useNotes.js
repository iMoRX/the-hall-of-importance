import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/database';

/**
 * Hook for CRUD operations on notes.
 * Provides reactive note lists filtered by space, tags, and deletion status.
 */
export function useNotes(spaceId = null, { includeDeleted = false } = {}) {
  const notes = useLiveQuery(async () => {
    let collection;

    if (includeDeleted) {
      collection = db.notes.where('isDeleted').equals(1);
    } else if (spaceId) {
      collection = db.notes.where('spaceId').equals(spaceId);
    } else {
      collection = db.notes.toCollection();
    }

    const all = await collection.toArray();

    // Filter out deleted notes unless we specifically want them
    const filtered = includeDeleted
      ? all
      : all.filter((n) => !n.isDeleted);

    // Sort: pinned first, then by updatedAt descending
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [spaceId, includeDeleted]);

  async function addNote({ title, body, spaceId, tags, expiresAt, isPinned }) {
    const now = new Date().toISOString();
    return db.notes.add({
      title: title || 'Untitled',
      body: body || '',
      spaceId,
      tags: tags || [],
      isPinned: isPinned || false,
      isDeleted: 0,
      expiresAt: expiresAt || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async function updateNote(id, changes) {
    return db.notes.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  }

  async function deleteNote(id) {
    // Soft delete
    return db.notes.update(id, {
      isDeleted: 1,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async function restoreNote(id) {
    return db.notes.update(id, {
      isDeleted: 0,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    });
  }

  async function permanentlyDelete(id) {
    // Delete associated files first
    await db.files.where('noteId').equals(id).delete();
    return db.notes.delete(id);
  }

  async function emptyTrash() {
    const trashed = await db.notes.where('isDeleted').equals(1).toArray();
    for (const note of trashed) {
      await db.files.where('noteId').equals(note.id).delete();
    }
    return db.notes.where('isDeleted').equals(1).delete();
  }

  async function togglePin(id) {
    const note = await db.notes.get(id);
    if (note) {
      return db.notes.update(id, {
        isPinned: !note.isPinned,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async function extendExpiry(id, newExpiresAt) {
    return db.notes.update(id, {
      expiresAt: newExpiresAt,
      updatedAt: new Date().toISOString(),
    });
  }

  async function keepForever(id) {
    return db.notes.update(id, {
      expiresAt: null,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    notes: notes || [],
    addNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDelete,
    emptyTrash,
    togglePin,
    extendExpiry,
    keepForever,
  };
}

/**
 * Hook to get all unique tags across notes, optionally filtered by space.
 */
export function useAllTags(spaceId = null) {
  const tags = useLiveQuery(async () => {
    let notes;
    if (spaceId) {
      notes = await db.notes.where('spaceId').equals(spaceId).toArray();
    } else {
      notes = await db.notes.toArray();
    }

    const activeNotes = notes.filter((n) => !n.isDeleted);
    const tagSet = new Set();
    activeNotes.forEach((n) => {
      if (n.tags) n.tags.forEach((t) => tagSet.add(t));
    });

    return Array.from(tagSet).sort();
  }, [spaceId]);

  return tags || [];
}

/**
 * Get note count per space
 */
export function useNoteCounts() {
  const counts = useLiveQuery(async () => {
    const notes = await db.notes.toArray();
    const active = notes.filter((n) => !n.isDeleted);
    const result = { all: active.length };
    active.forEach((n) => {
      result[n.spaceId] = (result[n.spaceId] || 0) + 1;
    });
    return result;
  });

  return counts || { all: 0 };
}
