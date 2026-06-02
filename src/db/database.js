import Dexie from 'dexie';
import { DEFAULT_SPACES } from '../utils/constants';

const db = new Dexie('HallOfImportance');

db.version(1).stores({
  spaces: '++id, name, order',
  notes: '++id, spaceId, isPinned, isDeleted, createdAt, updatedAt, expiresAt, *tags',
  files: '++id, noteId, name, type, size, createdAt',
});

let seeded = false;

/**
 * Seed default spaces on first launch.
 * Guarded by an in-memory flag to prevent StrictMode double-seeding.
 */
export async function seedDefaults() {
  if (seeded) return;
  seeded = true;

  const count = await db.spaces.count();
  if (count === 0) {
    await db.spaces.bulkAdd(
      DEFAULT_SPACES.map((s) => ({
        ...s,
        createdAt: new Date().toISOString(),
      }))
    );
  }
}

/**
 * Remove duplicate spaces that share the same name, keeping only the first of each.
 */
export async function deduplicateSpaces() {
  const allSpaces = await db.spaces.orderBy('id').toArray();
  const seen = new Set();
  for (const space of allSpaces) {
    if (seen.has(space.name)) {
      // Reassign notes from the duplicate to the original
      const original = allSpaces.find((s) => s.name === space.name && !seen.has(s.name) === false);
      // Just delete the duplicate space (notes stay orphaned but won't break)
      await db.notes.where('spaceId').equals(space.id).modify({ spaceId: allSpaces.find((s) => s.name === space.name && s.id !== space.id).id });
      await db.spaces.delete(space.id);
    } else {
      seen.add(space.name);
    }
  }
}

export default db;
