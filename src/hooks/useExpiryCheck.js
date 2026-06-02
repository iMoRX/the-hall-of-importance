import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { EXPIRY_WARNING_DAYS } from '../utils/constants';

export function useExpiryCheck() {
  const { session } = useAuth();
  const [expiringSoon, setExpiringSoon] = useState([]);

  const checkExpiry = useCallback(async () => {
    if (!session?.user?.id) return;

    const now = new Date();
    const warnDate = new Date();
    warnDate.setDate(warnDate.getDate() + EXPIRY_WARNING_DAYS);

    // Get active notes with an expiry date
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('is_deleted', false)
      .not('expires_at', 'is', null);

    if (!error && data) {
      const expired = [];
      const warning = [];

      for (const note of data) {
        const expires = new Date(note.expires_at);
        if (expires <= now) {
          expired.push(note);
        } else if (expires > now && expires <= warnDate) {
          warning.push(note);
        }
      }

      // Move expired notes to trash
      if (expired.length > 0) {
        const nowIso = new Date().toISOString();
        const updates = expired.map((note) =>
          supabase.from('notes').update({
            is_deleted: true,
            updated_at: nowIso
          }).eq('id', note.id)
        );
        await Promise.all(updates);
        console.log(`[ExpiryCheck] Moved ${expired.length} expired note(s) to trash.`);
      }

      setExpiringSoon(warning.map(n => ({
        ...n,
        spaceId: n.space_id,
        isPinned: n.is_pinned,
        isDeleted: n.is_deleted,
        expiresAt: n.expires_at,
        createdAt: n.created_at,
        updatedAt: n.updated_at
      })));
    }
  }, [session?.user?.id]);

  useEffect(() => {
    checkExpiry();
    const interval = setInterval(checkExpiry, 60 * 60 * 1000); // every hour
    return () => clearInterval(interval);
  }, [checkExpiry]);

  return {
    expiringSoon,
    expiringSoonCount: expiringSoon.length,
  };
}
