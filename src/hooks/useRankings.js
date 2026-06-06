import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

/**
 * Leaderboard hooks backed by the unified Elo ratings.
 *   * usePlayerRankings — everyone holding the `player` role, ordered by their
 *     `player` rating.
 *   * useTeamRankings   — all teams, ordered by their `team` rating.
 */

const ratingMap = async (subjectType, ids) => {
  if (!ids.length) return new Map();
  const { data } = await supabase
    .from('ratings')
    .select('subject_id, rating')
    .eq('subject_type', subjectType)
    .in('subject_id', ids);
  return new Map((data ?? []).map((r) => [r.subject_id, r.rating]));
};

export const usePlayerRankings = () =>
  useQuery({
    queryKey: ['rankings', 'players'],
    enabled: Boolean(supabase),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `id, display_name, handle, country_iso,
           roles:user_roles!inner(role),
           player:player_profiles(server, lane:lanes(name), rank:ranks(name)),
           memberships:team_members(team:teams(name))`,
        )
        .eq('roles.role', 'player');
      if (error) throw error;

      const people = data ?? [];
      const ratings = await ratingMap('player', people.map((p) => p.id));

      return people
        .map((p) => ({
          id: p.id,
          name: p.display_name || p.handle || 'Unknown',
          country: p.country_iso || null,
          lane: p.player?.lane?.name || null,
          rank: p.player?.rank?.name || null,
          team: p.memberships?.[0]?.team?.name || null,
          rating: ratings.get(p.id) ?? 1200,
        }))
        .sort((a, b) => b.rating - a.rating);
    },
  });

export const useTeamRankings = () =>
  useQuery({
    queryKey: ['rankings', 'teams'],
    enabled: Boolean(supabase),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, tag, status, region:regions(code,name), members:team_members(user_id)');
      if (error) throw error;

      const teams = data ?? [];
      const ratings = await ratingMap('team', teams.map((t) => t.id));

      return teams
        .map((t) => ({
          id: t.id,
          name: t.name,
          tag: t.tag || null,
          status: t.status,
          regionCode: t.region?.code || null,
          regionName: t.region?.name || null,
          members: (t.members ?? []).length,
          rating: ratings.get(t.id) ?? 1200,
        }))
        .sort((a, b) => b.rating - a.rating);
    },
  });
