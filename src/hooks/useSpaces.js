import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/database';

/**
 * Hook for CRUD operations on spaces.
 */
export function useSpaces() {
  const spaces = useLiveQuery(() => db.spaces.orderBy('order').toArray());

  async function addSpace({ name, color, icon }) {
    const maxOrder = spaces?.length
      ? Math.max(...spaces.map((s) => s.order)) + 1
      : 0;

    return db.spaces.add({
      name,
      color,
      icon: icon || 'Star',
      order: maxOrder,
      createdAt: new Date().toISOString(),
    });
  }

  async function updateSpace(id, changes) {
    return db.spaces.update(id, changes);
  }

  async function deleteSpace(id) {
    // Cascade delete all notes in this space
    await db.notes.where('spaceId').equals(id).delete();
    return db.spaces.delete(id);
  }

  async function reorderSpaces(orderedIds) {
    const updates = orderedIds.map((id, index) => db.spaces.update(id, { order: index }));
    return Promise.all(updates);
  }

  return {
    spaces: spaces || [],
    addSpace,
    updateSpace,
    deleteSpace,
    reorderSpaces,
  };
}
