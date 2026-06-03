import { useState, useEffect } from 'react';

/**
 * Custom React hook for fetching and managing all RTR application data
 *
 * This hook centralizes data fetching for teams, players, news, events, community
 * resources, and application statistics. It provides a single source of truth
 * for all data with built-in loading states and error handling.
 *
 * @returns {Object} Data object containing:
 * @returns {Array} teams - Array of team objects sorted by rating (desc)
 * @returns {Array} players - Array of player objects sorted by rating (desc)
 * @returns {Array} news - Array of news/update objects
 * @returns {Array} events - Array of upcoming tournament objects
 * @returns {Object} community - Object containing community resources
 * @returns {Object} stats - Object containing application statistics
 * @returns {boolean} isLoading - Loading state indicator
 * @returns {string|null} error - Error message if fetch fails
 *
 * @example
 * const { teams, players, isLoading, error } = useData();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <div>Error: {error}</div>;
 *
 * return <TeamsList teams={teams} />;
 */
export const useData = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  // Core data arrays (sorted by rating descending)
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  // Content data arrays (chronological/natural order)
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);

  // Configuration objects
  const [community, setCommunity] = useState({});
  const [stats, setStats] = useState({});

  // UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    /**
     * Fetches all application data from JSON files in parallel
     * Handles errors gracefully with fallback empty data structures
     */
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // ========================================
        // PARALLEL DATA FETCHING
        // ========================================
        // Fetch all JSON files simultaneously for better performance
        // Each fetch has error handling that returns empty fallback data
        const [teamsResponse, playersResponse, newsResponse, eventsResponse, communityResponse, statsResponse] = await Promise.all([
          fetch('/data/teams.json').then(res => res.json()).catch(() => []),
          fetch('/data/players.json').then(res => res.json()).catch(() => []),
          fetch('/data/news.json').then(res => res.json()).catch(() => []),
          fetch('/data/events.json').then(res => res.json()).catch(() => []),
          fetch('/data/community.json').then(res => res.json()).catch(() => ({})),
          fetch('/data/stats.json').then(res => res.json()).catch(() => ({}))
        ]);

        // ========================================
        // DATA STRUCTURE VALIDATION
        // ========================================
        // Handle both flat arrays and nested object structures
        // Some APIs return {teams: [...]} instead of [...]
        let processedTeams = teamsResponse;
        if (processedTeams && !Array.isArray(processedTeams) && processedTeams.teams) {
          processedTeams = processedTeams.teams;
        }

        let processedPlayers = playersResponse;
        if (processedPlayers && !Array.isArray(processedPlayers) && processedPlayers.players) {
          processedPlayers = processedPlayers.players;
        }

        // ========================================
        // DATA PROCESSING & STATE UPDATES
        // ========================================
        // Sort competitive data by rating (highest first) for leaderboards
        setTeams(processedTeams.sort((a, b) => b.rating - a.rating));
        setPlayers(processedPlayers.sort((a, b) => b.rating - a.rating));

        // Content data maintains original order (chronological)
        setNews(newsResponse);
        setEvents(eventsResponse);

        // Configuration data stored as-is
        setCommunity(communityResponse);
        setStats(statsResponse);

      } catch (dataProcessError) {
        // ========================================
        // ERROR HANDLING
        // ========================================
        console.error("Critical error mapping platform core arrays:", dataProcessError);
        setError(dataProcessError.message);
      } finally {
        // Always stop loading regardless of success/failure
        setIsLoading(false);
      }
    };

    // Trigger data fetch on component mount
    fetchData();
  }, []); // Empty dependency array - only fetch once on mount

  // ========================================
  // RETURN DATA INTERFACE
  // ========================================
  // Return all data and state in consistent object structure
  return { teams, players, news, events, community, stats, isLoading, error };
};