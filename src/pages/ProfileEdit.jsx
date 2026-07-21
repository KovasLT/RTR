import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { clearProfileCache } from '../lib/profileCache.js';
import { useRegions, useLanes, useRanks, useHeroes } from '../hooks/useReferenceData.js';
import { APP_CONSTANTS } from '../app-constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce'; // or implement inline

const ROLE_KEYS = ['player', 'coach', 'scout', 'team_manager'];

const inputClass =
  'w-full bg-gray-800 border border-gray-600 hover:border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500';

// Local default avatar images
const DEFAULT_AVATARS = [
  { url: '/male.png', label: 'Male' },
  { url: '/female.png', label: 'Female' },
];

const ProfileEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, roles, isAuthenticated, isLoading, refreshProfile } = useAuth();
  const qc = useQueryClient();
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
    secondaryLaneId: '',
    rankId: '',
    server: '',
    availability: '',
    heroPool: [],
    lookingForTeam: false,
    specialties: '',
    experienceYears: '',
    org: '',
    avatarUrl: '',
    referrerId: null, // new field
  });

  // Referrer combobox state
  const [referrerSearch, setReferrerSearch] = useState('');
  const [referrerOptions, setReferrerOptions] = useState([]);
  const [showReferrerDropdown, setShowReferrerDropdown] = useState(false);
  const [isLoadingReferrers, setIsLoadingReferrers] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Fetch referrer options when search changes
  const debouncedSearch = useDebounce(referrerSearch, 300); // if you have a hook, otherwise use a simple effect with timeout

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setReferrerOptions([]);
      return;
    }
    const fetchUsers = async () => {
      setIsLoadingReferrers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, handle')
          .ilike('display_name', `%${debouncedSearch}%`)
          .neq('id', user.id) // exclude self
          .limit(10);
        if (error) throw error;
        setReferrerOptions(data || []);
      } catch (err) {
        console.error('Error fetching users for referral:', err);
        setReferrerOptions([]);
      } finally {
        setIsLoadingReferrers(false);
      }
    };
    fetchUsers();
  }, [debouncedSearch, user.id]);

  // Load profile data into form
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
        secondaryLaneId: p?.secondary_lane_id ? String(p.secondary_lane_id) : f.secondaryLaneId,
        rankId: p?.rank_id ? String(p.rank_id) : f.rankId,
        server: p?.server || f.server,
        availability: p?.availability || f.availability,
        heroPool: Array.isArray(p?.hero_pool) ? p.hero_pool : f.heroPool,
        lookingForTeam: p ? !!p.looking_for_team : f.lookingForTeam,
        specialties: c?.specialties || f.specialties,
        experienceYears: c?.experience_years ? String(c.experience_years) : f.experienceYears,
        org: s?.org || f.org,
        avatarUrl: profile?.avatar_url || '',
        referrerId: profile?.referrer_user_id || null, // load existing referrer
      }));
      // If referrer exists, set search display name (optional)
      if (profile?.referrer_user_id) {
        // We could fetch the referrer's display name, but we'll just show the ID or not.
        // We'll handle display in the view.
      }
    })();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id, user?.username, profile, roles]);

  useEffect(() => {
    setAvatarPreview(form.avatarUrl || DEFAULT_AVATARS[0].url);
  }, [form.avatarUrl]);

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

  const handleSelectReferrer = (userId, displayName) => {
    set('referrerId', userId);
    setReferrerSearch(displayName); // show selected name
    setShowReferrerDropdown(false);
  };

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
          avatar_url: form.avatarUrl || null,
          referrer_user_id: form.referrerId || null, // allow setting once; if null, keep null
          updated_at: now,
        })
        .eq('id', uid);
      if (pErr) throw pErr;

      // ... rest of the profile updates (roles, player, coach, scout, etc.) unchanged ...

      // (Keep the existing role/player/coach/scout updates as they are)

      clearProfileCache();
      await qc.invalidateQueries({ queryKey: ['profile', uid] });
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
      {/* ... header ... */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">{isEditing ? C.EDIT_TITLE : C.TITLE}</h1>
        <p className="text-gray-400">{isEditing ? C.EDIT_SUBTITLE : C.SUBTITLE}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... error display ... */}

        {/* Basic info with avatar - unchanged */}

        {/* Referrer field - show only if user hasn't already set a referrer */}
        {!form.referrerId ? (
          <div className="rtr-card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{C.REFERRER_LABEL}</label>
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  placeholder={C.REFERRER_SEARCH_PLACEHOLDER}
                  value={referrerSearch}
                  onChange={(e) => {
                    setReferrerSearch(e.target.value);
                    setShowReferrerDropdown(true);
                  }}
                  onFocus={() => setShowReferrerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowReferrerDropdown(false), 150)}
                  disabled={!!form.referrerId}
                />
                {showReferrerDropdown && referrerOptions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto">
                    {referrerOptions.map((user) => (
                      <li
                        key={user.id}
                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white"
                        onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                        onClick={() => handleSelectReferrer(user.id, user.display_name || user.handle)}
                      >
                        {user.display_name || user.handle}
                      </li>
                    ))}
                  </ul>
                )}
                {isLoadingReferrers && (
                  <div className="absolute right-3 top-3">
                    <i className="fas fa-spinner fa-spin text-gray-400"></i>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Choose the person who invited you to Corener.</p>
            </div>
          </div>
        ) : (
          // If they already have a referrer, show it as read-only (but we'll display it in the view)
          // We can optionally show "Invited by: [name]" here, but we'll rely on the profile view.
          // We'll just skip showing any field.
          null
        )}

        {/* Roles - unchanged */}
        {/* Player details - unchanged */}
        {/* Coach details - unchanged */}
        {/* Scout details - unchanged */}

        <button type="submit" disabled={saving} className="w-full rtr-btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? C.SAVING : C.SAVE}
        </button>
      </form>
    </div>
  );
};

export default ProfileEdit;