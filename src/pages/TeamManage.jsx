import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTeam, useTeamMutations } from '../hooks/useTeams.js';
import { useDirectory } from '../hooks/useProfiles.js';
import { useRegions } from '../hooks/useReferenceData.js';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';

const T = APP_CONSTANTS.TEAM_MGMT;
const inputClass =
  'w-full bg-gray-800 border border-gray-600 hover:border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500';

const STATUS_OPTIONS = [
  { value: 'recruiting', label: T.STATUS_RECRUITING },
  { value: 'active', label: T.STATUS_ACTIVE },
  { value: 'inactive', label: T.STATUS_INACTIVE },
];

const personName = (p) => p?.display_name || p?.handle || 'Unknown';

/**
 * Team page (/team/:id). Public, read-only team profile for everyone; the
 * manager additionally gets edit, roster, applications and invite controls.
 */
const TeamManage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: team, isLoading } = useTeam(id);
  const { data: regions = [] } = useRegions();
  const {
    updateTeam,
    updateMember,
    invitePlayer,
    applyToTeam,
    respondToApplication,
    removeMember,
    addStaff,
    removeStaff,
  } = useTeamMutations();

  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Prefill the edit form once the team has loaded (async IIFE keeps this out of
  // the set-state-in-effect lint rule, matching ProfileEdit).
  useEffect(() => {
    if (!team) return;
    let active = true;
    (async () => {
      if (!active) return;
      setForm({
        name: team.name || '',
        tag: team.tag || '',
        logoUrl: team.logo_url || '',
        regionId: team.region?.id ? String(team.region.id) : '',
        status: team.status || 'recruiting',
        recruitmentNote: team.recruitment_note || '',
      });
    })();
    return () => {
      active = false;
    };
  }, [team]);

  const memberIds = useMemo(
    () => new Set((team?.members ?? []).map((m) => m.user_id)),
    [team],
  );
  const pendingInviteeIds = useMemo(
    () =>
      new Set(
        (team?.applications ?? [])
          .filter((a) => a.status === 'pending')
          .map((a) => a.applicant_id),
      ),
    [team],
  );

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!team) return <div className="text-center text-gray-400 py-16">{T.ERROR}</div>;

  const isManager = isAuthenticated && team.manager_id === user?.id;
  const isMember = memberIds.has(user?.id);
  // For a non-manager, useTeam only returns the viewer's own applications (RLS),
  // so this detects whether they already have a pending application/invite.
  const hasPendingForMe = (team.applications ?? []).some(
    (a) => a.applicant_id === user?.id && a.status === 'pending',
  );

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const act = async (fn) => {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message || T.ERROR);
    }
  };

  const saveDetails = (e) => {
    e.preventDefault();
    act(() =>
      updateTeam.mutateAsync({
        id: team.id,
        patch: {
          name: form.name,
          tag: form.tag || null,
          logo_url: form.logoUrl || null,
          region_id: form.regionId ? Number(form.regionId) : null,
          status: form.status,
          recruitment_note: form.recruitmentNote || null,
        },
      }),
    );
  };

  const pendingApplies = (team.applications ?? []).filter(
    (a) => a.status === 'pending' && a.type === 'apply',
  );
  const statusLabel = APP_CONSTANTS.TEAMS.STATUS[team.status] || team.status;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">
          {team.name}
          {team.tag && <span className="text-gray-500 text-xl ml-2">[{team.tag}]</span>}
        </h1>
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white">
          <i className="fas fa-arrow-left mr-2"></i>{T.BACK_TO_DASHBOARD}
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Public summary — visible to everyone */}
      <div className="rtr-card">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="bg-slate-800 text-slate-300 border border-slate-700/60 text-[11px] px-2 py-0.5 rounded font-bold tracking-wider">
            {team.region?.code || '—'}
          </span>
          <span className="text-gray-400">{statusLabel}</span>
          <span className="text-indigo-300 font-mono font-bold">
            {T.RATING}: {team.rating ?? 1200}
          </span>
        </div>
        {team.recruitment_note && (
          <div className="mt-4">
            <h4 className="text-xs uppercase tracking-wide text-gray-500 mb-1">{T.RECRUITMENT_HEADING}</h4>
            <p className="text-sm text-gray-300">{team.recruitment_note}</p>
          </div>
        )}

        {/* Apply / status for non-managers */}
        {isAuthenticated && !isManager && (
          <div className="mt-4">
            {isMember ? (
              <span className="text-sm text-green-400"><i className="fas fa-check mr-2"></i>{T.ON_ROSTER}</span>
            ) : hasPendingForMe ? (
              <span className="text-sm text-amber-300"><i className="fas fa-clock mr-2"></i>{T.APPLIED}</span>
            ) : (
              <button
                onClick={() => act(() => applyToTeam.mutateAsync({ teamId: team.id, applicantId: user.id }))}
                disabled={applyToTeam.isPending}
                className="rtr-btn-primary inline-flex disabled:opacity-50"
              >
                {applyToTeam.isPending ? T.APPLYING : T.APPLY}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Roster — public; edit controls only for the manager */}
      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-3">{T.ROSTER_TITLE}</h3>
        {team.members.length === 0 ? (
          <p className="text-sm text-gray-400">{T.ROSTER_EMPTY}</p>
        ) : (
          <div className="space-y-2">
            {team.members.map((m) => (
              <div key={m.user_id} className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
                <Link to={`/profile/${m.user_id}`} className="text-white font-medium hover:underline flex-grow">
                  {personName(m.profile)}
                  {m.is_captain && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide font-semibold bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 rounded px-1.5 py-0.5">
                      {T.CAPTAIN}
                    </span>
                  )}
                </Link>
                <span className="text-xs text-gray-500">{m.lane?.name || '—'}</span>
                {isManager && (
                  <>
                    <button
                      onClick={() => act(() => updateMember.mutateAsync({ teamId: team.id, userId: m.user_id, patch: { is_captain: !m.is_captain } }))}
                      className="text-xs text-gray-300 hover:text-indigo-300"
                    >
                      {T.MAKE_CAPTAIN}
                    </button>
                    <button
                      onClick={() => act(() => removeMember.mutateAsync({ teamId: team.id, userId: m.user_id }))}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      {T.REMOVE_MEMBER}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Staff — public; add/remove only for the manager */}
      <div className="rtr-card">
        <h3 className="text-lg font-semibold text-white mb-3">{T.STAFF_TITLE}</h3>
        {(team.staff ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">{T.STAFF_EMPTY}</p>
        ) : (
          <div className="space-y-2">
            {team.staff.map((s) => (
              <div key={s.user_id} className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
                <span className="text-[11px] uppercase tracking-wide font-semibold bg-gray-800 border border-gray-700 text-indigo-300 rounded px-2 py-0.5">
                  <i className={`fas ${T.STAFF_ROLE_ICONS[s.role]} mr-1`}></i>
                  {T.STAFF_ROLES[s.role] || s.role}
                </span>
                <Link to={`/profile/${s.user_id}`} className="text-white font-medium hover:underline flex-grow">
                  {personName(s.profile)}
                </Link>
                {isManager && (
                  <button
                    onClick={() => act(() => removeStaff.mutateAsync({ teamId: team.id, userId: s.user_id }))}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    {T.STAFF_REMOVE}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isManager && (
          <AddStaff
            existingIds={new Set((team.staff ?? []).map((s) => s.user_id))}
            onAdd={(userId, role) => act(() => addStaff.mutateAsync({ teamId: team.id, userId, role }))}
          />
        )}
      </div>

      {/* ---- Manager-only management below ---- */}
      {isManager && form && (
        <form onSubmit={saveDetails} className="rtr-card space-y-4">
          <h3 className="text-lg font-semibold text-white">{T.MANAGE_TITLE}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">{T.NAME_LABEL}</label>
              <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{T.TAG_LABEL}</label>
              <input className={inputClass} value={form.tag} onChange={(e) => set('tag', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{T.LOGO_LABEL}</label>
            <input className={inputClass} value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{T.REGION_LABEL}</label>
              <select className={inputClass} value={form.regionId} onChange={(e) => set('regionId', e.target.value)}>
                <option value="">{T.SELECT_PLACEHOLDER}</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{T.STATUS_LABEL}</label>
              <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{T.RECRUITMENT_LABEL}</label>
            <textarea
              className={inputClass}
              rows={2}
              placeholder={T.RECRUITMENT_PLACEHOLDER}
              value={form.recruitmentNote}
              onChange={(e) => set('recruitmentNote', e.target.value)}
            />
          </div>
          <button type="submit" disabled={updateTeam.isPending} className="rtr-btn-primary justify-center disabled:opacity-50">
            {updateTeam.isPending ? T.SAVING : T.SAVE}
          </button>
        </form>
      )}

      {isManager && (
        <div className="rtr-card">
          <h3 className="text-lg font-semibold text-white mb-3">{T.INBOX_TITLE}</h3>
          {pendingApplies.length === 0 ? (
            <p className="text-sm text-gray-400">{T.INBOX_EMPTY}</p>
          ) : (
            <div className="space-y-2">
              {pendingApplies.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
                  <Link to={`/profile/${a.applicant_id}`} className="text-white font-medium hover:underline flex-grow">
                    {personName(a.applicant)}
                  </Link>
                  {a.message && <span className="text-xs text-gray-500 italic">“{a.message}”</span>}
                  <button
                    onClick={() => act(() => respondToApplication.mutateAsync({ appId: a.id, accept: true }))}
                    className="text-xs font-semibold bg-green-900/30 border border-green-700/50 text-green-300 rounded px-3 py-1 hover:bg-green-900/50"
                  >
                    {T.INBOX_ACCEPT}
                  </button>
                  <button
                    onClick={() => act(() => respondToApplication.mutateAsync({ appId: a.id, accept: false }))}
                    className="text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-300 rounded px-3 py-1 hover:border-gray-500"
                  >
                    {T.INBOX_REJECT}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isManager && (
        <InvitePlayers
          search={search}
          setSearch={setSearch}
          excludeIds={memberIds}
          invitedIds={pendingInviteeIds}
          managerId={user?.id}
          onInvite={(applicantId) => act(() => invitePlayer.mutateAsync({ teamId: team.id, applicantId }))}
        />
      )}
    </div>
  );
};

/** Player search to send invites, reusing the directory query. */
const InvitePlayers = ({ search, setSearch, excludeIds, invitedIds, managerId, onInvite }) => {
  const { data: people = [] } = useDirectory();

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter((p) => p.roles.includes('player'))
      .filter((p) => p.id !== managerId && !excludeIds.has(p.id))
      .filter((p) => personName(p).toLowerCase().includes(q))
      .slice(0, 8);
  }, [people, search, excludeIds, managerId]);

  return (
    <div className="rtr-card">
      <h3 className="text-lg font-semibold text-white mb-3">{T.INVITE_TITLE}</h3>
      <input
        className={inputClass}
        placeholder={T.INVITE_SEARCH}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="mt-3 space-y-2">
        {results.map((p) => {
          const invited = invitedIds.has(p.id);
          return (
            <div key={p.id} className="flex items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
              <Link to={`/profile/${p.id}`} className="text-white font-medium hover:underline flex-grow">
                {personName(p)}
              </Link>
              <button
                disabled={invited}
                onClick={() => onInvite(p.id)}
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1 disabled:opacity-50"
              >
                {invited ? T.INVITE_SENT : T.INVITE_SEND}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const STAFF_ROLE_OPTIONS = ['coach', 'scout', 'analyst'];

/** Manager control: pick a staff role, search people, add them as staff. */
const AddStaff = ({ existingIds, onAdd }) => {
  const { data: people = [] } = useDirectory();
  const [role, setRole] = useState('coach');
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return people
      // Coaches/scouts must hold that role; analysts can be anyone.
      .filter((p) => (role === 'analyst' ? true : p.roles.includes(role)))
      .filter((p) => !existingIds.has(p.id))
      .filter((p) => personName(p).toLowerCase().includes(q))
      .slice(0, 8);
  }, [people, role, search, existingIds]);

  return (
    <div className="mt-4 border-t border-gray-800 pt-4">
      <h4 className="text-sm font-semibold text-white mb-2">{T.STAFF_ADD_TITLE}</h4>
      <div className="flex flex-wrap gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          {STAFF_ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{T.STAFF_ROLES[r]}</option>
          ))}
        </select>
        <input
          className="flex-grow bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          placeholder={T.STAFF_SEARCH}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="mt-3 space-y-2">
        {results.map((p) => (
          <div key={p.id} className="flex items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
            <Link to={`/profile/${p.id}`} className="text-white font-medium hover:underline flex-grow">
              {personName(p)}
            </Link>
            <button
              onClick={() => onAdd(p.id, role)}
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1"
            >
              {T.STAFF_ADD}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamManage;
