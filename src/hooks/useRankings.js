import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useTeamRankings = () => {
  return useQuery({
    queryKey: ['teamRankings'],
    queryFn: async () => {
      const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name, tag, status, region_id');
      if (error) throw error;

      const teamIds = teams.map(t => t.id);
      const { data: ratings } = await supabase
      .from('ratings')
      .select('subject_id, rating')
      .eq('subject_type', 'team')
      .in('subject_id', teamIds);
      const ratingMap = new Map((ratings || []).map(r => [r.subject_id, r.rating]));

      const { data: members } = await supabase
      .from('team_members')
      .select('team_id');
      const memberCountMap = new Map();
      members?.forEach(m => {
        memberCountMap.set(m.team_id, (memberCountMap.get(m.team_id) || 0) + 1);
      });

      const regionIds = [...new Set(teams.map(t => t.region_id).filter(Boolean))];
      const { data: regions } = await supabase
      .from('regions')
      .select('id, code')
      .in('id', regionIds);
      const regionMap = new Map((regions || []).map(r => [r.id, r.code]));

      const result = teams.map(t => ({
        id: t.id,
        name: t.name,
        tag: t.tag,
        status: t.status,
        regionCode: regionMap.get(t.region_id) || null,
                                     rating: ratingMap.get(t.id) || 1200,
                                     members: memberCountMap.get(t.id) || 0,
      }));
      result.sort((a, b) => b.rating - a.rating);
      return result;
    },
  });
};

export const usePlayerRankings = () => {
  return useQuery({
    queryKey: ['playerRankings'],
    queryFn: async () => {
      const { data: playerProfiles, error } = await supabase
      .from('player_profiles')
      .select('*');
      if (error) throw error;
      if (!playerProfiles || playerProfiles.length === 0) return [];

      const userIds = playerProfiles.map(p => p.user_id);
      const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, handle, avatar_url, country_iso')
      .in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const laneIds = [
        ...new Set(playerProfiles.map(p => p.lane_id)),
                  ...new Set(playerProfiles.map(p => p.secondary_lane_id))
      ].filter(Boolean);
      const { data: lanes } = await supabase
      .from('lanes')
      .select('id, name')
      .in('id', laneIds);
      const laneMap = new Map((lanes || []).map(l => [l.id, l.name]));

      const rankIds = [...new Set(playerProfiles.map(p => p.rank_id).filter(Boolean))];
      const { data: ranks } = await supabase
      .from('ranks')
      .select('id, name')
      .in('id', rankIds);
      const rankMap = new Map((ranks || []).map(r => [r.id, r.name]));

      const { data: ratings } = await supabase
      .from('ratings')
      .select('subject_id, rating')
      .eq('subject_type', 'player')
      .in('subject_id', userIds);
      const ratingMap = new Map((ratings || []).map(r => [r.subject_id, r.rating]));

      const { data: memberships } = await supabase
      .from('team_members')
      .select('user_id, team:teams(id, name, tag)')
      .in('user_id', userIds);
      const teamMap = new Map();
      memberships?.forEach(m => teamMap.set(m.user_id, m.team));

      const result = playerProfiles.map(p => {
        const prof = profileMap.get(p.user_id);
        const name = prof?.display_name || prof?.handle || p.server || 'Unknown';
        return {
          id: p.user_id,
          name,
          avatar: prof?.avatar_url,
          lane: laneMap.get(p.lane_id),
                                        secondaryLane: laneMap.get(p.secondary_lane_id),
                                        rank: rankMap.get(p.rank_id),
                                        server: p.server,
                                        lookingForTeam: p.looking_for_team,
                                        rating: ratingMap.get(p.user_id) || 1200,
                                        team: teamMap.get(p.user_id)?.name,
                                        teamId: teamMap.get(p.user_id)?.id,
                                        country: prof?.country_iso,
        };
      });
      result.sort((a, b) => b.rating - a.rating);
      return result;
    },
  });
};
