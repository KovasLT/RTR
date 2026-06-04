import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

/**
 * Reference data hooks (lanes, ranks, regions, heroes).
 * These tables rarely change, so they're cached aggressively.
 */
const fetchTable = (table, orderBy) => async () => {
  if (!supabase) return [];
  let query = supabase.from(table).select('*');
  if (orderBy) query = query.order(orderBy, { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const refOptions = {
  staleTime: Infinity,
  gcTime: Infinity,
};

export const useRegions = () =>
  useQuery({ queryKey: ['regions'], queryFn: fetchTable('regions', 'sort'), ...refOptions });

export const useLanes = () =>
  useQuery({ queryKey: ['lanes'], queryFn: fetchTable('lanes', 'sort'), ...refOptions });

export const useRanks = () =>
  useQuery({ queryKey: ['ranks'], queryFn: fetchTable('ranks', 'tier_order'), ...refOptions });

export const useHeroes = () =>
  useQuery({ queryKey: ['heroes'], queryFn: fetchTable('heroes', 'name'), ...refOptions });
