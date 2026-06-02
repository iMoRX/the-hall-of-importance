import { useState, useCallback, useRef } from 'react';
import db from '../db/database';
import { stripHtml, debounce } from '../utils/helpers';

/**
 * Hook for searching notes across title, body, and tags.
 * Supports scoping to a specific space.
 */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchRef = useRef(null);

  const performSearch = useCallback(
    debounce(async (searchQuery, spaceId) => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        setResults(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const q = searchQuery.toLowerCase().trim();

      try {
        let notes;
        if (spaceId) {
          notes = await db.notes.where('spaceId').equals(spaceId).toArray();
        } else {
          notes = await db.notes.toArray();
        }

        const active = notes.filter((n) => !n.isDeleted);

        const matched = active.filter((note) => {
          const titleMatch = note.title?.toLowerCase().includes(q);
          const bodyMatch = stripHtml(note.body)?.toLowerCase().includes(q);
          const tagMatch = note.tags?.some((t) => t.toLowerCase().includes(q));
          return titleMatch || bodyMatch || tagMatch;
        });

        // Sort: pinned first, then most recent
        matched.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        setResults(matched);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200),
    []
  );

  const search = useCallback(
    (searchQuery, spaceId) => {
      setQuery(searchQuery);
      performSearch(searchQuery, spaceId);
    },
    [performSearch]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setIsSearching(false);
  }, []);

  return {
    query,
    results,
    isSearching,
    search,
    clearSearch,
    searchRef,
  };
}
