import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';

export function useSpaces() {
  const { session } = useAuth();
  const [spaces, setSpaces] = useState([]);

  const fetchSpaces = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .order('order', { ascending: true });
    
    if (!error && data) {
      setSpaces(data);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  async function addSpace({ name, color, icon }) {
    const maxOrder = spaces?.length
      ? Math.max(...spaces.map((s) => s.order)) + 1
      : 0;

    const { data, error } = await supabase
      .from('spaces')
      .insert([{
        name,
        color,
        icon: icon || 'Star',
        order: maxOrder,
        user_id: session.user.id
      }])
      .select()
      .single();

    if (!error && data) {
      setSpaces(prev => [...prev, data]);
      return data;
    } else {
      console.error('Failed to add space:', error);
      alert('Error adding space: ' + (error?.message || 'Unknown error'));
    }
  }

  async function updateSpace(id, changes) {
    const { data, error } = await supabase
      .from('spaces')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setSpaces(prev => prev.map(s => s.id === id ? data : s));
    }
    return data;
  }

  async function deleteSpace(id) {
    // Supabase foreign key ON DELETE CASCADE will handle notes deletion
    const { error } = await supabase.from('spaces').delete().eq('id', id);
    if (!error) {
      setSpaces(prev => prev.filter(s => s.id !== id));
    }
  }

  async function reorderSpaces(orderedIds) {
    const updates = orderedIds.map((id, index) => 
      supabase.from('spaces').update({ order: index }).eq('id', id)
    );
    await Promise.all(updates);
    await fetchSpaces();
  }

  return {
    spaces,
    addSpace,
    updateSpace,
    deleteSpace,
    reorderSpaces,
  };
}
