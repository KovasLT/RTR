import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

/**
 * Teams, rosters & applications (Phase 2). Mirrors the react-query style of
 * useProfiles.js / useAdmin.js. All rating writes happen server-side; the
 * application lifecycle (accept/withdraw/remove) goes through SECURITY DEFINER
 * RPCs defined in 0007_teams.sql.
 */

const unwrap = (promise) =>
  promise.then((r) => {
    if (r.error) throw r.error;
    return r.data;
  });

const ratingFor = async (ids) => {
  if (!ids.length) return new Map();
  const { data } = await supabase
    .from('ratings')
    .select('subject_id, rating')
    .eq('subject_type', 'team')
    .in('subject_id', ids);
  return new Map((data ?? []).map((r) => [r.subject_id, r.rating]));
};

/** Teams managed by the given user, with member + pending-application counts. */
export const useMyTeams = (managerId) =>
  useQuery({
    queryKey: ['teams', 'mine', managerId],
    enabled: Boolean(supabase) && Boolean(managerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(
          'id, name, tag, logo_url, status, region:regions(code,name), members:team_members(user_id), applications(id,status)',
        )
        .eq('manager_id', managerId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const teams = data ?? [];
      const ratings = await ratingFor(teams.map((t) => t.id));
      return teams.map((t) => ({
        ...t,
        memberCount: (t.members ?? []).length,
        pendingCount: (t.applications ?? []).filter((a) => a.status === 'pending').length,
        rating: ratings.get(t.id) ?? null,
      }));
    },
  });

/** One team with its roster, applications, and team rating. */
export const useTeam = (id) =>
  useQuery({
    queryKey: ['teams', 'one', id],
    enabled: Boolean(supabase) && Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(
          `id, name, tag, logo_url, status, recruitment_note, manager_id,
           region:regions(id,code,name),
           members:team_members(
             user_id, lane_id, is_captain, joined_at,
             profile:profiles(id, display_name, handle, avatar_url),
             lane:lanes(id,name)
           ),
           staff:team_staff(
             user_id, role, added_at,
             profile:profiles(id, display_name, handle, avatar_url)
           ),
           applications(
             id, applicant_id, type, status, message, created_at,
             applicant:profiles(id, display_name, handle, avatar_url)
           )`,
        )
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const ratings = await ratingFor([data.id]);
      return { ...data, rating: ratings.get(data.id) ?? null };
    },
  });

/** Applications + invites involving the given user (player side). */
export const useMyApplications = (userId) =>
  useQuery({
    queryKey: ['applications', 'mine', userId],
    enabled: Boolean(supabase) && Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, team_id, type, status, message, created_at, team:teams(id,name,tag)')
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

/** Write actions for teams + applications. */
export const useTeamMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['teams'] });
    qc.invalidateQueries({ queryKey: ['applications'] });
    qc.invalidateQueries({ queryKey: ['directory'] });
  };

  const createTeam = useMutation({
    mutationFn: async ({ managerId, name, tag, regionId, status }) => {
      const team = await unwrap(
        supabase
          .from('teams')
          .insert({
            manager_id: managerId,
            name,
            tag: tag || null,
            region_id: regionId ? Number(regionId) : null,
            status: status || 'recruiting',
          })
          .select('id')
          .single(),
      );
      // Ensure the creator holds the team_manager role (seeds its own rating).
      await supabase
        .from('user_roles')
        .upsert({ user_id: managerId, role: 'team_manager' }, { onConflict: 'user_id,role', ignoreDuplicates: true });
      return team;
    },
    onSuccess: invalidate,
  });

  const updateTeam = useMutation({
    mutationFn: ({ id, patch }) =>
      unwrap(
        supabase
          .from('teams')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', id),
      ),
    onSuccess: invalidate,
  });

  const updateMember = useMutation({
    mutationFn: ({ teamId, userId, patch }) =>
      unwrap(supabase.from('team_members').update(patch).eq('team_id', teamId).eq('user_id', userId)),
    onSuccess: invalidate,
  });

  const invitePlayer = useMutation({
    mutationFn: ({ teamId, applicantId, message }) =>
      unwrap(
        supabase
          .from('applications')
          .insert({ team_id: teamId, applicant_id: applicantId, type: 'invite', message: message || null }),
      ),
    onSuccess: invalidate,
  });

  const applyToTeam = useMutation({
    mutationFn: ({ teamId, applicantId, message }) =>
      unwrap(
        supabase
          .from('applications')
          .insert({ team_id: teamId, applicant_id: applicantId, type: 'apply', message: message || null }),
      ),
    onSuccess: invalidate,
  });

  const respondToApplication = useMutation({
    mutationFn: ({ appId, accept }) =>
      unwrap(supabase.rpc('respond_to_application', { p_app_id: appId, p_accept: accept })),
    onSuccess: invalidate,
  });

  const withdrawApplication = useMutation({
    mutationFn: ({ appId }) => unwrap(supabase.rpc('withdraw_application', { p_app_id: appId })),
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: ({ teamId, userId }) =>
      unwrap(supabase.rpc('remove_team_member', { p_team_id: teamId, p_user_id: userId })),
    onSuccess: invalidate,
  });

  const addStaff = useMutation({
    mutationFn: ({ teamId, userId, role }) =>
      unwrap(supabase.from('team_staff').insert({ team_id: teamId, user_id: userId, role })),
    onSuccess: invalidate,
  });

  const removeStaff = useMutation({
    mutationFn: ({ teamId, userId }) =>
      unwrap(supabase.from('team_staff').delete().eq('team_id', teamId).eq('user_id', userId)),
    onSuccess: invalidate,
  });

  return {
    createTeam,
    updateTeam,
    updateMember,
    invitePlayer,
    applyToTeam,
    respondToApplication,
    withdrawApplication,
    removeMember,
    addStaff,
    removeStaff,
  };
};
