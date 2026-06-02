import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { stripHtml, debounce } from '../utils/helpers';

export function useSearch() {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchRef = useRef(null);

  const performSearch = useCallback(
    debounce(async (searchQuery, spaceId) => {
      if (!session?.user?.id || !searchQuery || searchQuery.trim().length === 0) {
        setResults(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const q = searchQuery.toLowerCase().trim();

      try {
        let queryBuilder = supabase.from('notes').select('*').eq('is_deleted', false);
        if (spaceId) {
          queryBuilder = queryBuilder.eq('space_id', spaceId);
        }

        const { data, error } = await queryBuilder;
        
        if (error) throw error;

        // Filter client-side to easily support tags arrays and HTML stripping
        const matched = data.filter((note) => {
          const titleMatch = note.title?.toLowerCase().includes(q);
          const bodyMatch = stripHtml(note.body)?.toLowerCase().includes(q);
          const tagMatch = note.tags?.some((t) => t.toLowerCase().includes(q));
          return titleMatch || bodyMatch || tagMatch;
        });

        // Sort: pinned first, then most recent
        matched.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.updated_at) - new Date(a.updated_at);
        });

        setResults(matched.map(n => ({
          ...n,
          spaceId: n.space_id,
          isPinned: n.is_pinned,
          isDeleted: n.is_deleted,
          expiresAt: n.expires_at,
          createdAt: n.created_at,
          updatedAt: n.updated_at
        })));
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200),
    [session?.user?.id]
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
