import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

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

export const useMyTeams = (managerId) =>
useQuery({
  queryKey: ['teams', 'mine', managerId],
  enabled: Boolean(supabase) && Boolean(managerId),
         queryFn: async () => {
           const { data, error } = await supabase
           .from('teams')
           .select(
             'id, name, tag, logo_url, status, region:regions(code,name), members:team_members(user_id, left_at), applications(id,status)',
           )
           .eq('manager_id', managerId)
           .order('created_at', { ascending: true });
           if (error) throw error;

           const teams = data ?? [];
           const ratings = await ratingFor(teams.map((t) => t.id));
           return teams.map((t) => {
             const activeMembers = (t.members ?? []).filter(m => m.left_at === null);
             return {
               ...t,
               memberCount: activeMembers.length,
               pendingCount: (t.applications ?? []).filter((a) => a.status === 'pending').length,
                            rating: ratings.get(t.id) ?? null,
             };
           });
         },
});

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
                     user_id, lane_id, is_captain, role, joined_at, left_at,
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

export const useRecruitingTeams = () =>
useQuery({
  queryKey: ['teams', 'recruiting'],
  enabled: Boolean(supabase),
         queryFn: async () => {
           const { data, error } = await supabase
           .from('teams')
           .select('id, name, tag, recruitment_note, region:regions(id, code), members:team_members(user_id, left_at)')
           .eq('status', 'recruiting');
           if (error) throw error;
           return (data ?? []).map((t) => ({
             id: t.id,
             name: t.name,
             tag: t.tag,
             note: t.recruitment_note,
             regionId: t.region?.id ?? null,
             regionCode: t.region?.code ?? null,
             memberCount: (t.members ?? []).filter(m => m.left_at === null).length,
           }));
         },
});

export const useMyStaffTeams = (userId, role) =>
useQuery({
  queryKey: ['teams', 'staff', userId, role ?? 'any'],
  enabled: Boolean(supabase) && Boolean(userId),
         queryFn: async () => {
           let q = supabase
           .from('team_staff')
           .select('role, team:teams(id, name, tag, status, region:regions(code))')
           .eq('user_id', userId);
           if (role) q = q.eq('role', role);
           const { data, error } = await q;
           if (error) throw error;
           return (data ?? [])
           .filter((r) => r.team)
           .map((r) => ({
             teamId: r.team.id,
             name: r.team.name,
             tag: r.team.tag,
             status: r.team.status,
             regionCode: r.team.region?.code ?? null,
             staffRole: r.role,
           }));
         },
});

export const useMyMemberships = (userId) =>
useQuery({
  queryKey: ['teams', 'member', userId],
  enabled: Boolean(supabase) && Boolean(userId),
         queryFn: async () => {
           const { data, error } = await supabase
           .from('team_members')
           .select('team_id, is_captain, role, lane:lanes(name), team:teams(id, name, tag, status, region:regions(code))')
           .eq('user_id', userId)
           .is('left_at', null); // only active
           if (error) throw error;

           const rows = (data ?? []).filter((r) => r.team);
           const ratings = await ratingFor(rows.map((r) => r.team_id));
           return rows.map((r) => ({
             teamId: r.team_id,
             name: r.team.name,
             tag: r.team.tag,
             status: r.team.status,
             regionCode: r.team.region?.code || null,
             lane: r.lane?.name || null,
             isCaptain: r.is_captain,
             role: r.role || 'player',
             rating: ratings.get(r.team_id) ?? null,
           }));
         },
});

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

export const useAllTeams = () =>
useQuery({
  queryKey: ['teams', 'all'],
  enabled: Boolean(supabase),
         queryFn: async () => {
           const { data, error } = await supabase
           .from('teams')
           .select('id, name, tag, status')
           .order('name');
           if (error) throw error;
           return data ?? [];
         },
});

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

  // ✅ FIXED: re‑add if left_at is not null
  const addTeamMember = useMutation({
    mutationFn: async ({ teamId, userId, laneId, role }) => {
      // Check existing membership (including left)
      const { data: existing } = await supabase
      .from('team_members')
      .select('user_id, left_at')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();
      if (existing) {
        if (existing.left_at !== null) {
          // Re‑activate: set left_at = null, update role/lane
          return unwrap(
            supabase
            .from('team_members')
            .update({ left_at: null, lane_id: laneId || null, role: role || 'player' })
            .eq('team_id', teamId)
            .eq('user_id', userId)
          );
        } else {
          throw new Error('User is already an active member of this team');
        }
      } else {
        // New member
        return unwrap(
          supabase.from('team_members').insert({
            team_id: teamId,
            user_id: userId,
            lane_id: laneId || null,
            role: role || 'player',
          })
        );
      }
    },
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
    unwrap(
      supabase
      .from('team_members')
      .update({ left_at: new Date().toISOString() })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .is('left_at', null),
    ),
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
    addTeamMember,
    invitePlayer,
    applyToTeam,
    respondToApplication,
    withdrawApplication,
    removeMember,
    addStaff,
    removeStaff,
  };
};
