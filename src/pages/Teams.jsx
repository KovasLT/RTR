import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTeamRankings } from '../hooks/useRankings';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { APP_CONSTANTS } from '../app-constants';

const ALL = APP_CONSTANTS.TEAMS.ALL_REGIONS;

const Teams = () => {
  const { user } = useAuth();
  const { data: teams = [], isLoading, error } = useTeamRankings();
  const [currentRegionFilter, setCurrentRegionFilter] = useState(ALL);
  const [tournamentInvites, setTournamentInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [userManagedTeam, setUserManagedTeam] = useState(null);

  // Find the team that the current user manages
  useEffect(() => {
    if (user && teams.length > 0) {
      const managed = teams.find(team => team.manager_id === user.id);
      setUserManagedTeam(managed || null);
    }
  }, [user, teams]);

  // Fetch tournament invitations for the user's managed team
  useEffect(() => {
    const fetchInvites = async () => {
      if (!userManagedTeam) {
        setTournamentInvites([]);
        setLoadingInvites(false);
        return;
      }

      const { data, error } = await supabase
        .from('tournament_invitations')
        .select(`
          *,
          tournament:tournaments(id, title, format, start_date, end_date)
        `)
        .eq('team_id', userManagedTeam.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching tournament invites:', error);
      } else {
        setTournamentInvites(data || []);
      }
      setLoadingInvites(false);
    };

    fetchInvites();
  }, [userManagedTeam]);

  const handleTournamentInvite = async (inviteId, status, tournamentId, teamId) => {
    // Update invitation status
    const { error: updateError } = await supabase
      .from('tournament_invitations')
      .update({ status })
      .eq('id', inviteId);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    // If accepting, add team to tournament_teams
    if (status === 'accepted') {
      const { error: insertError } = await supabase
        .from('tournament_teams')
        .insert({
          tournament_id: tournamentId,
          team_id: teamId,
        });
      if (insertError) {
        console.error('Error registering team:', insertError);
        alert('Failed to register team. Please contact support.');
        return;
      }
    }

    // Remove the invite from local state
    setTournamentInvites(prev => prev.filter(inv => inv.id !== inviteId));
    alert(status === 'accepted' ? 'Invitation accepted! Your team is registered.' : 'Invitation declined.');
  };

  // Region tabs logic
  const availableRegions = useMemo(() => {
    const codes = [...new Set(teams.map((t) => t.regionCode).filter(Boolean))].sort();
    return [ALL, ...codes];
  }, [teams]);

  const filteredTeams = useMemo(() => {
    if (currentRegionFilter === ALL) return teams;
    return teams.filter((team) => team.regionCode === currentRegionFilter);
  }, [teams, currentRegionFilter]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-400">{APP_CONSTANTS.UI.ERROR_LOADING_DATA} {error.message}</div>;

  const getStatusMarkerStyle = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-500 animate-pulse';
      case 'recruiting': return 'bg-indigo-500 animate-pulse';
      case 'inactive': return 'bg-amber-500';
      default: return 'bg-rose-500';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{APP_CONSTANTS.TEAMS.PAGE_TITLE}</h2>
        <div className="flex bg-[#13192b] border border-slate-800 p-1 rounded-lg">
          {availableRegions.map((regionKey) => {
            const isCurrent = currentRegionFilter === regionKey;
            const stateClasses = isCurrent
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60';
            return (
              <button
                key={regionKey}
                onClick={() => setCurrentRegionFilter(regionKey)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${stateClasses}`}
              >
                {regionKey}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tournament Invitations Section (only visible if user manages a team and there are invites) */}
      {userManagedTeam && !loadingInvites && tournamentInvites.length > 0 && (
        <div className="mb-8 bg-[#151922] rounded-xl p-5 border border-indigo-800/50">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <i className="fas fa-envelope text-indigo-400"></i>
            Tournament Invitations for {userManagedTeam.name}
          </h3>
          <div className="space-y-3">
            {tournamentInvites.map((inv) => (
              <div key={inv.id} className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h4 className="text-white font-semibold">{inv.tournament?.title}</h4>
                    <div className="text-gray-400 text-sm">
                      {inv.tournament?.format?.replace('_', ' ')} · {inv.tournament?.start_date} – {inv.tournament?.end_date}
                    </div>
                    {inv.message && <div className="text-indigo-300 text-xs mt-1 italic">"{inv.message}"</div>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTournamentInvite(inv.id, 'accepted', inv.tournament_id, userManagedTeam.id)}
                      className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleTournamentInvite(inv.id, 'rejected', inv.tournament_id, userManagedTeam.id)}
                      className="bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Teams Table */}
      <div className="bg-[#13192b] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.RANK}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.TEAM}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.TAG}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.REGION}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.RATING}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.MEMBERS}</th>
                <th className="px-6 py-4">{APP_CONSTANTS.TEAMS.TABLE_HEADERS.STATUS}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTeams.map((team, index) => (
                <tr key={team.id} className="rtr-table-row hover:bg-slate-900/40 transition">
                  <td className="px-6 py-4 font-bold text-slate-400 font-mono">{index + 1}</td>
                  <td className="px-6 py-4">
                    <Link to={`/team/${team.id}`} className="text-white font-bold tracking-wide hover:text-indigo-300">
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-mono">{team.tag || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">
                      {team.regionCode || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-black text-indigo-400">{team.rating}</td>
                  <td className="px-6 py-4 font-mono text-slate-400 text-xs">{team.members}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${getStatusMarkerStyle(team.status)} inline-block`}></span>
                      <span className="font-medium text-[11px] text-slate-400">
                        {APP_CONSTANTS.TEAMS.STATUS[team.status] || team.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center text-slate-400 mt-8">
          {APP_CONSTANTS.TEAMS.EMPTY_STATE}
        </div>
      )}
    </div>
  );
};

export default Teams;