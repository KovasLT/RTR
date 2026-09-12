import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from './useAuth.jsx';
import {
  readProfileCache,
  readProfileCacheTime,
  writeProfileCache,
  patchProfileCache,
} from '../lib/profileCache.js';

const PROFILE_CACHE_TTL = 2 * 24 * 60 * 60 * 1000;

const unwrap = (promise) =>
promise.then((r) => {
  if (r.error) throw r.error;
  return r.data;
});

const fetchRolesForUsers = async (userIds) => {
  if (!userIds.length) return new Map();
  const { data } = await supabase
  .from('user_roles')
  .select('user_id, role')
  .in('user_id', userIds);
  const map = new Map();
  data?.forEach(row => {
    if (!map.has(row.user_id)) map.set(row.user_id, []);
    map.get(row.user_id).push(row.role);
  });
  return map;
};

const fetchPlayerProfiles = async (userIds) => {
  if (!userIds.length) return new Map();
  const { data } = await supabase
  .from('player_profiles')
  .select('*')
  .in('user_id', userIds);
  const map = new Map();
  data?.forEach(p => map.set(p.user_id, p));
  return map;
};

const fetchLanes = async (laneIds) => {
  if (!laneIds.length) return new Map();
  const { data } = await supabase
  .from('lanes')
  .select('id, name')
  .in('id', laneIds);
  const map = new Map();
  data?.forEach(l => map.set(l.id, l));
  return map;
};

const fetchRanks = async (rankIds) => {
  if (!rankIds.length) return new Map();
  const { data } = await supabase
  .from('ranks')
  .select('id, name')
  .in('id', rankIds);
  const map = new Map();
  data?.forEach(r => map.set(r.id, r));
  return map;
};

/**
 * Browseable directory of everyone with a profile.
 */
export const useDirectory = () =>
useQuery({
  queryKey: ['directory'],
  queryFn: async () => {
    if (!supabase) return [];

    const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url, bio, country_iso, created_at, region_id');
    if (error) throw error;
    if (!profiles.length) return [];

    const userIds = profiles.map(p => p.id);

    const rolesMap = await fetchRolesForUsers(userIds);
    const playerProfilesMap = await fetchPlayerProfiles(userIds);

    const regionIds = [...new Set(profiles.map(p => p.region_id).filter(Boolean))];
    const { data: regions } = await supabase
    .from('regions')
    .select('id, code, name')
    .in('id', regionIds);
    const regionMap = new Map(regions?.map(r => [r.id, r]) || []);

    const laneIds = [...new Set(Object.values(playerProfilesMap).map(p => p.lane_id).filter(Boolean))];
    const laneMap = await fetchLanes(laneIds);

    const rankIds = [...new Set(Object.values(playerProfilesMap).map(p => p.rank_id).filter(Boolean))];
    const rankMap = await fetchRanks(rankIds);

    const { data: ratings } = await supabase
    .from('ratings')
    .select('subject_id, rating')
    .eq('subject_type', 'player')
    .in('subject_id', userIds);
    const ratingMap = new Map(ratings?.map(r => [r.subject_id, r.rating]) || []);

    return profiles.map(prof => {
      const roles = rolesMap.get(prof.id) || [];
      const playerProf = playerProfilesMap.get(prof.id);
      const region = regionMap.get(prof.region_id);
      return {
        id: prof.id,
        handle: prof.handle,
        display_name: prof.display_name,
        avatar_url: prof.avatar_url,
        bio: prof.bio,
        country_iso: prof.country_iso,
        created_at: prof.created_at,
        region,
        roles,
        player: playerProf ? {
          lane: laneMap.get(playerProf.lane_id) || null,
                        secondary_lane: laneMap.get(playerProf.secondary_lane_id) || null,
                        rank: rankMap.get(playerProf.rank_id) || null,
                        server: playerProf.server,
                        looking_for_team: playerProf.looking_for_team,
                        availability: playerProf.availability,
                        hero_pool: playerProf.hero_pool || [],
        } : null,
        playerRating: ratingMap.get(prof.id) || null,
      };
    });
  },
});

/**
 * A single profile by id.
 */
export const useProfile = (id) => {
  const { user } = useAuth();
  const isSelf = Boolean(id) && user?.id === id;

  return useQuery({
    queryKey: ['profile', id],
    enabled: Boolean(id) && Boolean(supabase),
                  initialData: isSelf ? () => readProfileCache(id) ?? undefined : undefined,
                  initialDataUpdatedAt: isSelf ? () => readProfileCacheTime(id) : undefined,
                  staleTime: isSelf ? PROFILE_CACHE_TTL : 0,
                  queryFn: async () => {
                    const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('id, handle, display_name, avatar_url, bio, country_iso, created_at, region_id')
                    .eq('id', id)
                    .maybeSingle();
                    if (error) throw error;
                    if (!profile) return null;

                    const rolesMap = await fetchRolesForUsers([id]);
                    const roles = rolesMap.get(id) || [];

                    let region = null;
                    if (profile.region_id) {
                      const { data: regionData } = await supabase
                      .from('regions')
                      .select('id, code, name')
                      .eq('id', profile.region_id)
                      .single();
                      region = regionData;
                    }

                    const playerProfilesMap = await fetchPlayerProfiles([id]);
                    const playerProf = playerProfilesMap.get(id);
                    let player = null;
                    if (playerProf) {
                      const laneIds = [playerProf.lane_id, playerProf.secondary_lane_id].filter(Boolean);
                      const laneMap = await fetchLanes(laneIds);
                      const rankMap = await fetchRanks([playerProf.rank_id].filter(Boolean));
                      player = {
                        lane: laneMap.get(playerProf.lane_id) || null,
                  secondary_lane: laneMap.get(playerProf.secondary_lane_id) || null,
                  rank: rankMap.get(playerProf.rank_id) || null,
                  server: playerProf.server,
                  looking_for_team: playerProf.looking_for_team,
                  availability: playerProf.availability,
                  hero_pool: playerProf.hero_pool || [],
                      };
                    }

                    const { data: ratings } = await supabase
                    .from('ratings')
                    .select('subject_type, rating, games_count')
                    .eq('subject_id', id);

                    let coach = null;
                    if (roles.includes('coach')) {
                      const { data: coachData } = await supabase
                      .from('coach_profiles')
                      .select('specialties, experience_years, availability')
                      .eq('user_id', id)
                      .maybeSingle();
                      coach = coachData;
                    }

                    let scout = null;
                    if (roles.includes('scout')) {
                      const { data: scoutData } = await supabase
                      .from('scout_profiles')
                      .select('org, regions')
                      .eq('user_id', id)
                      .maybeSingle();
                      scout = scoutData;
                    }

                    let tournamentManager = null;
                    if (roles.includes('tournament_manager')) {
                      const { data: tmData } = await supabase
                      .from('tournament_manager_profiles')
                      .select('org')
                      .eq('user_id', id)
                      .maybeSingle();
                      tournamentManager = tmData;
                    }

                    let teamManager = null;
                    if (roles.includes('team_manager')) {
                      const { data: tmData } = await supabase
                      .from('team_manager_profiles')
                      .select('user_id')
                      .eq('user_id', id)
                      .maybeSingle();
                      teamManager = tmData;
                    }

                    const result = {
                      id: profile.id,
                      handle: profile.handle,
                      display_name: profile.display_name,
                      avatar_url: profile.avatar_url,
                      bio: profile.bio,
                      country_iso: profile.country_iso,
                      created_at: profile.created_at,
                      region,
                      roles,
                      player,
                      coach,
                      scout,
                      tournament_manager: tournamentManager,
                      team_manager: teamManager,
                      ratings: ratings || [],
                    };

                    if (isSelf) writeProfileCache(id, result);

                    return result;
                  },
  });
};

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

/**
 * Owner-only edits to the current user's player profile.
 */
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
    onMutate: async ({ userId, value }) => {
      await qc.cancelQueries({ queryKey: ['profile', userId] });
      const previous = qc.getQueryData(['profile', userId]);
      qc.setQueryData(['profile', userId], (old) =>
      old?.player
      ? { ...old, player: { ...old.player, looking_for_team: value } }
      : old,
      );
      patchProfileCache(userId, (data) =>
      data?.player
      ? { ...data, player: { ...data.player, looking_for_team: value } }
      : data,
      );
      return { previous, userId };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(['profile', vars.userId], ctx.previous);
        patchProfileCache(vars.userId, (data) =>
        data?.player
        ? { ...data, player: { ...data.player, looking_for_team: ctx.previous.player?.looking_for_team } }
        : data,
        );
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['directory'], refetchType: 'none' });
      qc.invalidateQueries({ queryKey: ['rankings'], refetchType: 'none' });
    },
  });

  return { setLookingForTeam };
};

/**
 * Tournament medals a player earned *while on the roster* of a team.
 *
 * A placement counts only if the tournament's end date falls inside
 * one of the player's membership windows (joined_at → left_at) for
 * the team that earned the placement. This way, medals a player won
 * on a previous roster still show on their profile, but medals earned
 * after they left do not.
 */
export const usePlayerAchievements = (userId) =>
useQuery({
  queryKey: ['player-achievements', userId],
  enabled: Boolean(userId) && Boolean(supabase),
         queryFn: async () => {
           // 1. All memberships (active + historical)
           const { data: memberships, error: memErr } = await supabase
           .from('team_members')
           .select(`
           team_id, joined_at, left_at,
           team:teams!team_id(id, name, tag, logo_url)
           `)
           .eq('user_id', userId);
           if (memErr) throw memErr;
           if (!memberships?.length) return [];

           const teamIds = [...new Set(memberships.map((m) => m.team_id))];

           // 2. All placements for those teams
           const { data: placements, error: placeErr } = await supabase
           .from('tournament_teams')
           .select(`
           team_id, placement,
           tournament:tournaments(id, title, end_date, start_date, created_at)
           `)
           .in('team_id', teamIds)
           .not('placement', 'is', null);
           if (placeErr) throw placeErr;

           // 3. Keep only placements earned during a membership window
           const results = [];
           for (const p of placements || []) {
             const t = p.tournament;
             const endTs = new Date(
               t?.end_date || t?.start_date || t?.created_at
             ).getTime();
             if (Number.isNaN(endTs)) continue;

             const wasOnTeam = memberships
             .filter((m) => m.team_id === p.team_id)
             .some((m) => {
               const joinedTs = new Date(m.joined_at).getTime();
               const leftTs = m.left_at
               ? new Date(m.left_at).getTime()
               : Number.POSITIVE_INFINITY;
               return endTs >= joinedTs && endTs <= leftTs;
             });

             if (wasOnTeam) {
               const teamRow = memberships.find((m) => m.team_id === p.team_id);
               results.push({
                 team_id: p.team_id,
                 placement: p.placement,
                 tournament: t,
                 team: teamRow?.team || null,
                 endTs,
               });
             }
           }

           results.sort((a, b) => b.endTs - a.endTs);
           return results;
         },
});
