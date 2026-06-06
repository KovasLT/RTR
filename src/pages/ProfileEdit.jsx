import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { useRegions, useLanes, useRanks, useHeroes } from '../hooks/useReferenceData.js';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';

const ROLE_KEYS = ['player', 'coach', 'scout', 'tournament_manager', 'team_manager'];

const inputClass =
  'w-full bg-gray-800 border border-gray-600 hover:border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500';

/**
 * Profile editor — serves both first-time onboarding (`/onboarding`) and later
 * edits (`/profile/edit`). Writes the profile row, claimed roles, and the
 * role-specific detail rows to Supabase.
 */
const ProfileEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, roles, isAuthenticated, isLoading, refreshProfile } = useAuth();
  const { data: regions = [] } = useRegions();
  const { data: lanes = [] } = useLanes();
  const { data: ranks = [] } = useRanks();
  const { data: heroes = [] } = useHeroes();

  const isEditing = location.pathname === '/profile/edit';

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    regionId: '',
    countryIso: '',
    roles: [],
    laneId: '',
    rankId: '',
    server: '',
    availability: '',
    heroPool: [],
    lookingForTeam: false,
    specialties: '',
    experienceYears: '',
    org: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Prefill the form from the existing profile, roles, and role-specific rows.
  // Done inside an async callback so it runs once the data has loaded.
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let active = true;

    (async () => {
      let p = null;
      let c = null;
      let s = null;
      if (supabase) {
        const results = await Promise.all([
          supabase.from('player_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('coach_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('scout_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        ]);
        p = results[0].data;
        c = results[1].data;
        s = results[2].data;
      }
      if (!active) return;

      setForm((f) => ({
        ...f,
        displayName: profile?.display_name || user?.username || '',
        bio: profile?.bio || '',
        regionId: profile?.region_id ? String(profile.region_id) : '',
        countryIso: profile?.country_iso || '',
        roles: roles || [],
        laneId: p?.lane_id ? String(p.lane_id) : f.laneId,
        rankId: p?.rank_id ? String(p.rank_id) : f.rankId,
        server: p?.server || f.server,
        availability: p?.availability || f.availability,
        heroPool: Array.isArray(p?.hero_pool) ? p.hero_pool : f.heroPool,
        lookingForTeam: p ? !!p.looking_for_team : f.lookingForTeam,
        specialties: c?.specialties || f.specialties,
        experienceYears: c?.experience_years ? String(c.experience_years) : f.experienceYears,
        org: s?.org || f.org,
      }));
    })();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id, user?.username, profile, roles]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleRole = (r) =>
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r],
    }));
  const toggleHero = (name) =>
    setForm((f) => ({
      ...f,
      heroPool: f.heroPool.includes(name) ? f.heroPool.filter((x) => x !== name) : [...f.heroPool, name],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const uid = user.id;
      const now = new Date().toISOString();

      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          display_name: form.displayName || null,
          bio: form.bio || null,
          region_id: form.regionId ? Number(form.regionId) : null,
          country_iso: form.countryIso || null,
          updated_at: now,
        })
        .eq('id', uid);
      if (pErr) throw pErr;

      if (form.roles.length) {
        const rows = form.roles.map((role) => ({ user_id: uid, role }));
        const { error: rErr } = await supabase
          .from('user_roles')
          .upsert(rows, { onConflict: 'user_id,role', ignoreDuplicates: true });
        if (rErr) throw rErr;
      }

      if (form.roles.includes('player')) {
        const { error: err } = await supabase.from('player_profiles').upsert({
          user_id: uid,
          lane_id: form.laneId ? Number(form.laneId) : null,
          rank_id: form.rankId ? Number(form.rankId) : null,
          server: form.server || null,
          availability: form.availability || null,
          hero_pool: form.heroPool,
          looking_for_team: form.lookingForTeam,
          updated_at: now,
        });
        if (err) throw err;
      }
      if (form.roles.includes('coach')) {
        await supabase.from('coach_profiles').upsert({
          user_id: uid,
          specialties: form.specialties || null,
          experience_years: form.experienceYears ? Number(form.experienceYears) : null,
          updated_at: now,
        });
      }
      if (form.roles.includes('scout')) {
        await supabase.from('scout_profiles').upsert({ user_id: uid, org: form.org || null, updated_at: now });
      }
      if (form.roles.includes('tournament_manager')) {
        await supabase
          .from('tournament_manager_profiles')
          .upsert({ user_id: uid, org: form.org || null, updated_at: now });
      }
      if (form.roles.includes('team_manager')) {
        await supabase.from('team_manager_profiles').upsert({ user_id: uid, updated_at: now });
      }

      await refreshProfile();
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const C = APP_CONSTANTS.ONBOARDING;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isEditing ? C.EDIT_TITLE : C.TITLE}
        </h1>
        <p className="text-gray-400">{isEditing ? C.EDIT_SUBTITLE : C.SUBTITLE}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-red-400"></i>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Basic info */}
        <div className="rtr-card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{C.DISPLAY_NAME_LABEL}</label>
            <input className={inputClass} value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{C.BIO_LABEL}</label>
            <textarea className={inputClass} rows={3} placeholder={C.BIO_PLACEHOLDER} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{C.REGION_LABEL}</label>
              <select className={inputClass} value={form.regionId} onChange={(e) => set('regionId', e.target.value)}>
                <option value="">{C.SELECT_PLACEHOLDER}</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{C.COUNTRY_LABEL}</label>
              <input className={inputClass} maxLength={2} value={form.countryIso} onChange={(e) => set('countryIso', e.target.value.toUpperCase())} />
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="rtr-card space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{C.ROLES_LABEL}</h3>
            <p className="text-sm text-gray-400">{C.ROLES_HINT}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLE_KEYS.map((r) => {
              const active = form.roles.includes(r);
              return (
                <button
                  type="button"
                  key={r}
                  onClick={() => toggleRole(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <i className={`fas ${APP_CONSTANTS.ROLE_ICONS[r]} mr-2`}></i>
                  {APP_CONSTANTS.ROLES[r]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Player details */}
        {form.roles.includes('player') && (
          <div className="rtr-card space-y-4">
            <h3 className="text-lg font-semibold text-white">{C.PLAYER_SECTION}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{C.LANE_LABEL}</label>
                <select className={inputClass} value={form.laneId} onChange={(e) => set('laneId', e.target.value)}>
                  <option value="">{C.SELECT_PLACEHOLDER}</option>
                  {lanes.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{C.RANK_LABEL}</label>
                <select className={inputClass} value={form.rankId} onChange={(e) => set('rankId', e.target.value)}>
                  <option value="">{C.SELECT_PLACEHOLDER}</option>
                  {ranks.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{C.SERVER_LABEL}</label>
                <input className={inputClass} value={form.server} onChange={(e) => set('server', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{C.AVAILABILITY_LABEL}</label>
                <input className={inputClass} placeholder={C.AVAILABILITY_PLACEHOLDER} value={form.availability} onChange={(e) => set('availability', e.target.value)} />
              </div>
            </div>
            {heroes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{C.HERO_POOL_LABEL}</label>
                <p className="text-xs text-gray-500 mb-2">{C.HERO_POOL_HINT}</p>
                <div className="flex flex-wrap gap-2">
                  {heroes.map((h) => {
                    const on = form.heroPool.includes(h.name);
                    return (
                      <button
                        type="button"
                        key={h.id}
                        onClick={() => toggleHero(h.name)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          on ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {h.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={form.lookingForTeam} onChange={(e) => set('lookingForTeam', e.target.checked)} />
              {C.LFT_LABEL}
            </label>
          </div>
        )}

        {/* Coach details */}
        {form.roles.includes('coach') && (
          <div className="rtr-card space-y-4">
            <h3 className="text-lg font-semibold text-white">{C.COACH_SECTION}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{C.SPECIALTIES_LABEL}</label>
              <input className={inputClass} value={form.specialties} onChange={(e) => set('specialties', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{C.EXPERIENCE_LABEL}</label>
              <input className={inputClass} type="number" min="0" value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} />
            </div>
          </div>
        )}

        {/* Scout / org details */}
        {(form.roles.includes('scout') || form.roles.includes('tournament_manager')) && (
          <div className="rtr-card space-y-4">
            <h3 className="text-lg font-semibold text-white">{C.SCOUT_SECTION}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{C.ORG_LABEL}</label>
              <input className={inputClass} value={form.org} onChange={(e) => set('org', e.target.value)} />
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="w-full rtr-btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? C.SAVING : C.SAVE}
        </button>
      </form>
    </div>
  );
};

export default ProfileEdit;
