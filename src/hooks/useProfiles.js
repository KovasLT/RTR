import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

const unwrap = (promise) =>
promise.then((r) => {
  if (r.error) throw r.error;
  return r.data;
});

// Helper: fetch user roles for a list of user IDs
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

// Helper: fetch player profiles for a list of user IDs
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

// Helper: fetch lane names for lane IDs
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

// Helper: fetch rank names for rank IDs
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
export const useProfile = (id) =>
useQuery({
  queryKey: ['profile', id],
  enabled: Boolean(id) && Boolean(supabase),
         queryFn: async () => {
           // 1. Get profile
           const { data: profile, error } = await supabase
           .from('profiles')
           .select('id, handle, display_name, avatar_url, bio, country_iso, created_at, region_id')
           .eq('id', id)
           .maybeSingle();
           if (error) throw error;
           if (!profile) return null;

           // 2. Get roles
           const rolesMap = await fetchRolesForUsers([id]);
           const roles = rolesMap.get(id) || [];

           // 3. Get region
           let region = null;
           if (profile.region_id) {
             const { data: regionData } = await supabase
             .from('regions')
             .select('id, code, name')
             .eq('id', profile.region_id)
             .single();
             region = regionData;
           }

           // 4. Get player profile (if exists)
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

           // 5. Get ratings for all roles
           const { data: ratings } = await supabase
           .from('ratings')
           .select('subject_type, rating, games_count')
           .eq('subject_id', id);

           // 6. Get coach profile
           let coach = null;
           if (roles.includes('coach')) {
             const { data: coachData } = await supabase
             .from('coach_profiles')
             .select('specialties, experience_years, availability')
             .eq('user_id', id)
             .maybeSingle();
             coach = coachData;
           }

           // 7. Get scout profile
           let scout = null;
           if (roles.includes('scout')) {
             const { data: scoutData } = await supabase
             .from('scout_profiles')
             .select('org, regions')
             .eq('user_id', id)
             .maybeSingle();
             scout = scoutData;
           }

           // 8. Get tournament manager profile (optional)
           let tournamentManager = null;
           if (roles.includes('tournament_manager')) {
             const { data: tmData } = await supabase
             .from('tournament_manager_profiles')
             .select('org')
             .eq('user_id', id)
             .maybeSingle();
             tournamentManager = tmData;
           }

           // 9. Get team manager profile
           let teamManager = null;
           if (roles.includes('team_manager')) {
             const { data: tmData } = await supabase
             .from('team_manager_profiles')
             .select('user_id')
             .eq('user_id', id)
             .maybeSingle();
             teamManager = tmData;
           }

           return {
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
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['profile', vars.userId] });
      qc.invalidateQueries({ queryKey: ['directory'] });
      qc.invalidateQueries({ queryKey: ['rankings'] });
    },
  });

  return { setLookingForTeam };
};
