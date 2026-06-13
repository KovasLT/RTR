import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

const unwrap = (promise) =>
promise.then((r) => {
  if (r.error) throw r.error;
  return r.data;
});

export const useMyWatchlist = (scoutId) =>
useQuery({
  queryKey: ['myWatchlist', scoutId],
  enabled: Boolean(scoutId),
         queryFn: async () => {
           const { data, error } = await supabase
           .from('scout_interests')
           .select(`
           player_id,
           player:profiles!player_id(display_name, handle, avatar_url)
           `)
           .eq('scout_id', scoutId);
           if (error) throw error;

           if (!data?.length) return [];

           const playerIds = data.map(item => item.player_id);
           // Fetch player_profiles for lane/rank
           const { data: profiles } = await supabase
           .from('player_profiles')
           .select('user_id, lane:lanes(name), rank:ranks(name), looking_for_team')
           .in('user_id', playerIds);
           const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

           // Fetch ratings
           const { data: ratings } = await supabase
           .from('ratings')
           .select('subject_id, rating')
           .eq('subject_type', 'player')
           .in('subject_id', playerIds);
           const ratingMap = new Map(ratings?.map(r => [r.subject_id, r.rating]) || []);

           // Fetch current team for each player
           const { data: memberships } = await supabase
           .from('team_members')
           .select('user_id, team:teams(name, tag)')
           .in('user_id', playerIds)
           .is('left_at', null);
           const teamMap = new Map();
           memberships?.forEach(m => teamMap.set(m.user_id, m.team));

           return data.map(item => {
             const player = item.player;
             const profile = profileMap.get(item.player_id);
             const rating = ratingMap.get(item.player_id) || 1200;
             const team = teamMap.get(item.player_id);
             return {
               id: item.player_id,
               playerId: item.player_id,
               name: player?.display_name || player?.handle || 'Unknown',
               lane: profile?.lane?.name || null,
               rank: profile?.rank?.name || null,
               rating,
               team: team?.name,
               teamTag: team?.tag,
               lookingForTeam: profile?.looking_for_team || false,
             };
           });
         },
});

export const useScoutsWatchingMe = (playerId) =>
useQuery({
  queryKey: ['scoutsWatchingMe', playerId],
  enabled: Boolean(playerId),
         queryFn: async () => {
           const { data, error } = await supabase
           .from('scout_interests')
           .select(`
           scout_id,
           scout:profiles!scout_id(display_name, handle)
           `)
           .eq('player_id', playerId);
           if (error) throw error;
           return data || [];
         },
});

export const useScoutMutations = () => {
  const qc = useQueryClient();

  const watch = useMutation({
    mutationFn: async ({ scoutId, playerId }) => {
      const { error } = await supabase
      .from('scout_interests')
      .upsert({ scout_id: scoutId, player_id: playerId }, { onConflict: 'scout_id,player_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['myWatchlist', vars.scoutId] });
      qc.invalidateQueries({ queryKey: ['scoutsWatchingMe'] });
    },
  });

  const unwatch = useMutation({
    mutationFn: async ({ scoutId, playerId }) => {
      const { error } = await supabase
      .from('scout_interests')
      .delete()
      .eq('scout_id', scoutId)
      .eq('player_id', playerId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['myWatchlist', vars.scoutId] });
      qc.invalidateQueries({ queryKey: ['scoutsWatchingMe'] });
    },
  });

  return { watch, unwatch };
};
