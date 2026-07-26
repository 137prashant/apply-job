'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { filtersToSearchParams } from './applicationQuery';
import { apiFetch } from './apiClient';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export function usePaginatedApplications(filters, { enabled = true } = {}) {
  const [applications, setApplications] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || '');
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search || '');
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  );

  const filterKey = JSON.stringify(effectiveFilters);

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const fetchApplications = useCallback(async () => {
    if (!enabled) return;

    const fetchId = ++fetchIdRef.current;
    setLoading(true);

    try {
      const params = filtersToSearchParams(effectiveFilters);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const response = await apiFetch(`/api/emails?${params.toString()}`);
      const data = await response.json();

      if (fetchId !== fetchIdRef.current) return;

      if (response.ok) {
        setApplications(data.applications || []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, page, effectiveFilters]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const refresh = useCallback(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    page,
    setPage,
    total,
    totalPages,
    pageSize: PAGE_SIZE,
    loading,
    refresh,
  };
}

export function useApplicationStats({ enabled = true } = {}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const response = await apiFetch('/api/emails/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}
