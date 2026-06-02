import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/database';
import { EXPIRY_WARNING_DAYS } from '../utils/constants';

/**
 * Hook that periodically checks for expired notes and provides
 * a list of notes expiring soon for the sidebar badge / review queue.
 */
export function useExpiryCheck() {
  // Get notes expiring soon (within EXPIRY_WARNING_DAYS)
  const expiringSoon = useLiveQuery(async () => {
    const now = new Date();
    const warnDate = new Date();
    warnDate.setDate(warnDate.getDate() + EXPIRY_WARNING_DAYS);

    const allNotes = await db.notes.toArray();
    return allNotes.filter((n) => {
      if (n.isDeleted || !n.expiresAt) return false;
      const expires = new Date(n.expiresAt);
      return expires > now && expires <= warnDate;
    });
  });

  // Auto-trash expired notes on mount and every hour
  useEffect(() => {
    async function trashExpired() {
      const now = new Date().toISOString();
      const allNotes = await db.notes.toArray();
      const expired = allNotes.filter(
        (n) => !n.isDeleted && n.expiresAt && new Date(n.expiresAt) <= new Date()
      );

      for (const note of expired) {
        await db.notes.update(note.id, {
          isDeleted: 1,
          deletedAt: now,
          updatedAt: now,
        });
      }

      if (expired.length > 0) {
        console.log(`[ExpiryCheck] Moved ${expired.length} expired note(s) to trash.`);
      }
    }

    trashExpired();
    const interval = setInterval(trashExpired, 60 * 60 * 1000); // every hour
    return () => clearInterval(interval);
  }, []);

  return {
    expiringSoon: expiringSoon || [],
    expiringSoonCount: expiringSoon?.length || 0,
  };
}
