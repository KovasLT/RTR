import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

const unwrap = (promise) =>
  promise.then((r) => {
    if (r.error) throw r.error;
    return r.data;
  });

/**
 * Shared select for a profile + its roles and role-specific detail rows.
 */
const PROFILE_SELECT = `
  id, handle, display_name, avatar_url, bio, country_iso, created_at,
  region:regions ( id, code, name ),
  roles:user_roles ( role ),
  player:player_profiles (
    lane_id, rank_id, server, looking_for_team, availability, hero_pool,
    lane:lanes ( id, name ),
    rank:ranks ( id, name )
  ),
  coach:coach_profiles ( specialties, experience_years, availability ),
  scout:scout_profiles ( org, regions ),
  tournament_manager:tournament_manager_profiles ( org ),
  team_manager:team_manager_profiles ( user_id )
`;

const normalizeRoles = (row) => ({
  ...row,
  roles: (row.roles ?? []).map((r) => r.role),
});

/**
 * Browseable directory of everyone with a profile. Player ratings are attached
 * for display. Filtering is done client-side by the Directory page.
 */
export const useDirectory = () =>
  useQuery({
    queryKey: ['directory'],
    queryFn: async () => {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .order('display_name', { ascending: true });
      if (error) throw error;

      const people = (data ?? []).map(normalizeRoles);

      // Attach each person's player rating (subject_type = 'player').
      const { data: ratings } = await supabase
        .from('ratings')
        .select('subject_id, rating')
        .eq('subject_type', 'player');
      const byId = new Map((ratings ?? []).map((r) => [r.subject_id, r.rating]));

      return people.map((p) => ({ ...p, playerRating: byId.get(p.id) ?? null }));
    },
  });

/**
 * A single profile by id, including all of its ratings (one per role).
 */
export const useProfile = (id) =>
  useQuery({
    queryKey: ['profile', id],
    enabled: Boolean(id) && Boolean(supabase),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: ratings } = await supabase
        .from('ratings')
        .select('subject_type, rating, games_count')
        .eq('subject_id', id);

      return { ...normalizeRoles(data), ratings: ratings ?? [] };
    },
  });

/**
 * Full rating history for a subject (oldest → newest), from the ledger.
 */
export const useRatingHistory = (subjectType, subjectId) =>
  useQuery({
    queryKey: ['rating_history', subjectType, subjectId],
    enabled: Boolean(supabase) && Boolean(subjectType) && Boolean(subjectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rating_events')
        .select('new_rating, delta, reason, created_at')
        .eq('subject_type', subjectType)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

/** Owner-only edits to the current user's player profile. */
export const usePlayerMutations = () => {
  const qc = useQueryClient();

  const setLookingForTeam = useMutation({
    mutationFn: ({ userId, value }) =>
      unwrap(
        supabase
          .from('player_profiles')
          .update({ looking_for_team: value, updated_at: new Date().toISOString() })
          .eq('user_id', userId),
      ),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['profile', vars.userId] });
      qc.invalidateQueries({ queryKey: ['directory'] });
      qc.invalidateQueries({ queryKey: ['rankings'] });
    },
  });

  return { setLookingForTeam };
};
