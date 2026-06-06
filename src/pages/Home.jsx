import { useData } from '../hooks/useData';
import LoadingSpinner from '../components/LoadingSpinner';
import NewsFeed from '../components/NewsFeed';
import { APP_CONSTANTS } from '../app-constants';

/**
 * Home Page Component
 *
 * Main dashboard page displaying RTR brand messaging, live statistics,
 * recent news/updates, and upcoming tournaments. Serves as the landing
 * page and provides overview of platform activity and content.
 *
 * Features:
 * - Hero section with brand messaging and feature highlights
 * - Live statistics dashboard (teams, players, events, regions)
 * - Dynamic news feed from news.json
 * - Upcoming tournaments from events.json
 *
 * @returns {JSX.Element} Complete home page layout with dashboard content
 */
const Home = () => {
  // ========================================
  // DATA FETCHING & STATE MANAGEMENT
  // ========================================
  const { teams, players, events, stats, isLoading, error } = useData();

  // Handle loading and error states
  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-400">{APP_CONSTANTS.UI.ERROR_LOADING_DATA} {error}</div>;

  return (
    <div className="animate-fade-in">

      {/* ========================================
          HERO SECTION
          ======================================== */}
      <div className="bg-[#13192b] border border-slate-800/60 rounded-2xl p-10 text-center mb-8 shadow-xl">
        {/* Main Brand Heading */}
        <h2 className="text-4xl font-black text-white mb-3 uppercase tracking-tight">
          {APP_CONSTANTS.HOME.MAIN_HEADING} <span className="text-indigo-400">{APP_CONSTANTS.HOME.MAIN_HEADING_ACCENT}</span>
        </h2>

        {/* Subtitle Description */}
        <p className="text-slate-400 text-lg">{APP_CONSTANTS.BRAND.SUBTITLE}</p>

        {/* Feature Highlights */}
        <div className="mt-6 flex justify-center gap-6 text-[11px] font-mono text-slate-500 font-bold tracking-widest uppercase">
          <span>{APP_CONSTANTS.HOME.FEATURES.TRANSPARENT}</span> •
          <span>{APP_CONSTANTS.HOME.FEATURES.PUBLIC_DATA}</span> •
          <span>{APP_CONSTANTS.HOME.FEATURES.COMMUNITY_INFO}</span>
        </div>
      </div>

      {/* ========================================
          STATISTICS DASHBOARD
          ======================================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

        {/* Teams Count (Dynamic from data) */}
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-black text-indigo-400 mb-1">{teams.length}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {APP_CONSTANTS.HOME.STATS.TEAMS_TRACKED}
          </div>
        </div>

        {/* Players Count (Dynamic from data) */}
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-black text-indigo-400 mb-1">{players.length}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {APP_CONSTANTS.HOME.STATS.PLAYERS_TRACKED}
          </div>
        </div>

        {/* Events Count (Static from stats.json) */}
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-black text-emerald-400 mb-1">{stats.eventsRecorded || 0}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {APP_CONSTANTS.HOME.STATS.EVENTS_RECORDED}
          </div>
        </div>

        {/* Regions Count (Static from stats.json) */}
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-black text-amber-400 mb-1">{stats.regionsCovered || 0}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {APP_CONSTANTS.HOME.STATS.REGIONS_COVERED}
          </div>
        </div>
      </div>

      {/* ========================================
          CONTENT SECTIONS (News & Events)
          ======================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ========================================
            NEWS/UPDATES SECTION (Left Column)
            ======================================== */}
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-6">
          {/* Section Header */}
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            <i className={`${APP_CONSTANTS.ICONS.NEWSPAPER} mr-2 text-indigo-400`}></i>
            {APP_CONSTANTS.HOME.SECTIONS.UPDATES}
          </h3>

          {/* Approved community news from the database */}
          <NewsFeed limit={5} compact showViewAll />
        </div>

        {/* ========================================
            UPCOMING TOURNAMENTS SECTION (Right Column)
            ======================================== */}
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-6">
          {/* Section Header */}
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            <i className={`${APP_CONSTANTS.ICONS.CALENDAR} text-indigo-400 mr-2`}></i>
            {APP_CONSTANTS.HOME.SECTIONS.UPCOMING_TOURNAMENTS}
          </h3>

          {/* Events List */}
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={index} className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg flex justify-between items-center">
                {/* Event Info (Left) */}
                <div>
                  {/* Event Name */}
                  <p className="text-xs font-bold text-slate-200">{event.name}</p>

                  {/* Event Details */}
                  <div className="flex items-center gap-2 mt-1">
                    {/* Game Type Badge */}
                    <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700/60 font-bold px-1 rounded tracking-wide font-mono uppercase">
                      {event.gameType}
                    </span>

                    {/* Region */}
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      {event.region}
                    </p>
                  </div>
                </div>

                {/* Countdown Badge (Right) */}
                <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded tracking-wide uppercase">
                  {event.countdown}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;