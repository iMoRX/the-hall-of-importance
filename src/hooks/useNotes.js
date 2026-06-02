import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';

const notesEmitter = new EventTarget();
export const triggerNotesRefetch = () => notesEmitter.dispatchEvent(new Event('refetch'));

export function useNotes(spaceId = null, { includeDeleted = false } = {}) {
  const { session } = useAuth();
  const [notes, setNotes] = useState([]);

  const fetchNotes = useCallback(async () => {
    if (!session?.user?.id) return;
    
    let query = supabase.from('notes').select('*');
    
    if (includeDeleted) {
      query = query.eq('is_deleted', true);
    } else {
      query = query.eq('is_deleted', false);
      if (spaceId) {
        query = query.eq('space_id', spaceId);
      }
    }

    const { data, error } = await query;
    if (!error && data) {
      // Sort: pinned first, then by updatedAt descending
      const sorted = data.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      // Map snake_case from DB to camelCase for UI
      setNotes(sorted.map(n => ({
        ...n,
        spaceId: n.space_id,
        isPinned: n.is_pinned,
        isDeleted: n.is_deleted,
        expiresAt: n.expires_at,
        createdAt: n.created_at,
        updatedAt: n.updated_at
      })));
    }
  }, [session?.user?.id, spaceId, includeDeleted]);

  useEffect(() => {
    fetchNotes();
    notesEmitter.addEventListener('refetch', fetchNotes);
    return () => notesEmitter.removeEventListener('refetch', fetchNotes);
  }, [fetchNotes]);

  async function addNote({ title, body, spaceId, tags, expiresAt, isPinned }) {
    const { data, error } = await supabase
      .from('notes')
      .insert([{
        title: title || 'Untitled',
        body: body || '',
        space_id: spaceId,
        tags: tags || [],
        is_pinned: isPinned || false,
        is_deleted: false,
        expires_at: expiresAt || null,
        user_id: session.user.id
      }])
      .select()
      .single();

    if (!error) {
      triggerNotesRefetch();
      return data.id;
    }
    return null;
  }

  async function updateNote(id, changes) {
    const payload = { ...changes };
    if (payload.spaceId !== undefined) { payload.space_id = payload.spaceId; delete payload.spaceId; }
    if (payload.isPinned !== undefined) { payload.is_pinned = payload.isPinned; delete payload.isPinned; }
    if (payload.isDeleted !== undefined) { payload.is_deleted = payload.isDeleted; delete payload.isDeleted; }
    if (payload.expiresAt !== undefined) { payload.expires_at = payload.expiresAt; delete payload.expiresAt; }
    
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase.from('notes').update(payload).eq('id', id);
    if (!error) triggerNotesRefetch();
  }

  async function deleteNote(id) {
    await supabase.from('notes').update({
      is_deleted: true,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    triggerNotesRefetch();
  }

  async function restoreNote(id) {
    await supabase.from('notes').update({
      is_deleted: false,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    triggerNotesRefetch();
  }

  async function permanentlyDelete(id) {
    // Delete files in storage first (to be implemented in storage phase)
    // Then delete note
    await supabase.from('notes').delete().eq('id', id);
    triggerNotesRefetch();
  }

  async function emptyTrash() {
    await supabase.from('notes').delete().eq('is_deleted', true);
    triggerNotesRefetch();
  }

  async function togglePin(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
      await supabase.from('notes').update({
        is_pinned: !note.isPinned,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      triggerNotesRefetch();
    }
  }

  async function extendExpiry(id, newExpiresAt) {
    await supabase.from('notes').update({
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    triggerNotesRefetch();
  }

  async function keepForever(id) {
    await supabase.from('notes').update({
      expires_at: null,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    triggerNotesRefetch();
  }

  return {
    notes,
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

export function useAllTags(spaceId = null) {
  const { session } = useAuth();
  const [tags, setTags] = useState([]);

  const fetchTags = useCallback(async () => {
    if (!session?.user?.id) return;
    let query = supabase.from('notes').select('tags').eq('is_deleted', false);
    if (spaceId) query = query.eq('space_id', spaceId);

    const { data, error } = await query;
    if (!error && data) {
      const tagSet = new Set();
      data.forEach(n => {
        if (n.tags) n.tags.forEach(t => tagSet.add(t));
      });
      setTags(Array.from(tagSet).sort());
    }
  }, [session?.user?.id, spaceId]);

  useEffect(() => {
    fetchTags();
    notesEmitter.addEventListener('refetch', fetchTags);
    return () => notesEmitter.removeEventListener('refetch', fetchTags);
  }, [fetchTags]);

  return tags;
}

export function useNoteCounts() {
  const { session } = useAuth();
  const [counts, setCounts] = useState({ all: 0 });

  const fetchCounts = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase.from('notes').select('space_id').eq('is_deleted', false);
    if (!error && data) {
      const result = { all: data.length };
      data.forEach(n => {
        result[n.space_id] = (result[n.space_id] || 0) + 1;
      });
      setCounts(result);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchCounts();
    notesEmitter.addEventListener('refetch', fetchCounts);
    return () => notesEmitter.removeEventListener('refetch', fetchCounts);
  }, [fetchCounts]);

  return counts;
}
