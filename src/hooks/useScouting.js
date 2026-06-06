import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

/**
 * Scout interest (watchlists). RLS keeps rows private to the scout who owns
 * them and the player being watched.
 */

const unwrap = (promise) =>
  promise.then((r) => {
    if (r.error) throw r.error;
    return r.data;
  });

/** Scouts watching a given player (player side: "scouts watching me"). */
export const useScoutsWatchingMe = (playerId) =>
  useQuery({
    queryKey: ['scouting', 'watchers', playerId],
    enabled: Boolean(supabase) && Boolean(playerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_interests')
        .select('id, status, created_at, scout:profiles!scout_interests_scout_id_fkey(id, display_name, handle, avatar_url)')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

/** A scout's own watchlist, with each player's detail + player rating. */
export const useMyWatchlist = (scoutId) =>
  useQuery({
    queryKey: ['scouting', 'watchlist', scoutId],
    enabled: Boolean(supabase) && Boolean(scoutId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scout_interests')
        .select(
          `id, status, note, created_at,
           player:profiles!scout_interests_player_id_fkey(
             id, display_name, handle, avatar_url,
             player:player_profiles(server, lane:lanes(name), rank:ranks(name))
           )`,
        )
        .eq('scout_id', scoutId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data ?? []).filter((r) => r.player);
      const { data: ratings } = await supabase
        .from('ratings')
        .select('subject_id, rating')
        .eq('subject_type', 'player')
        .in('subject_id', rows.map((r) => r.player.id));
      const byId = new Map((ratings ?? []).map((r) => [r.subject_id, r.rating]));

      return rows.map((r) => ({
        id: r.id,
        status: r.status,
        note: r.note,
        playerId: r.player.id,
        name: r.player.display_name || r.player.handle || 'Unknown',
        lane: r.player.player?.lane?.name || null,
        rank: r.player.player?.rank?.name || null,
        rating: byId.get(r.player.id) ?? null,
      }));
    },
  });

/** Add / remove players from the current scout's watchlist. */
export const useScoutMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['scouting'] });

  const watch = useMutation({
    mutationFn: ({ scoutId, playerId, note }) =>
      unwrap(supabase.from('scout_interests').insert({ scout_id: scoutId, player_id: playerId, note: note || null })),
    onSuccess: invalidate,
  });

  const unwatch = useMutation({
    mutationFn: ({ scoutId, playerId }) =>
      unwrap(supabase.from('scout_interests').delete().eq('scout_id', scoutId).eq('player_id', playerId)),
    onSuccess: invalidate,
  });

  return { watch, unwatch };
};
