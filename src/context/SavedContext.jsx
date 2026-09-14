import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const SavedContext = createContext(null);

export function SavedProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [savedListings, setSavedListings] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const fetchSaved = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedListings([]);
      setSavedIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const resp = await api.getSaved();
      const results = resp.results || [];
      setSavedListings(results);
      setSavedIds(new Set(results.map((item) => item.listing_id)));
    } catch (err) {
      console.warn('Failed to fetch saved listings:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved, user?.email]);

  const toggleSave = async (listing) => {
    if (!isAuthenticated) return;
    const id = listing.listing_id;
    const isCurrentlySaved = savedIds.has(id);

    // Optimistic UI update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(id);
      else next.add(id);
      return next;
    });

    if (isCurrentlySaved) {
      setSavedListings((prev) => prev.filter((item) => item.listing_id !== id));
      try {
        await api.removeSaved(id);
      } catch (err) {
        console.error('Failed to remove saved listing:', err);
        // Revert on error
        fetchSaved();
      }
    } else {
      setSavedListings((prev) => [listing, ...prev]);
      try {
        await api.addSaved(id);
      } catch (err) {
        console.error('Failed to add saved listing:', err);
        // Revert on error
        fetchSaved();
      }
    }
  };

  const isSaved = (id) => savedIds.has(id);

  return (
    <SavedContext.Provider
      value={{
        savedListings,
        savedIds,
        savedCount: savedListings.length,
        loading,
        toggleSave,
        isSaved,
        refetchSaved: fetchSaved,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used within a SavedProvider');
  return ctx;
}
