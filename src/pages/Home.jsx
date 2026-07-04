import { useData } from '../hooks/useData';
// IMPORT YOUR AUTH HOOK HERE - Adjust the path and hook name as needed
import { useAuth } from '../hooks/useAuth'; 
import LoadingSpinner from '../components/LoadingSpinner';
import NewsFeed from '../components/NewsFeed';
import { APP_CONSTANTS } from '../app-constants';

/**
 * Logged-Out Welcome View
 * Displays static community information and Discord links.
 */
const WelcomeView = () => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto mt-10">
      <div className="bg-[#13192b] border border-slate-800/60 rounded-2xl p-12 text-center shadow-xl">
        
        {/* Brand Heading */}
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
          {APP_CONSTANTS.WELCOME.HEADING} <span className="text-indigo-400">{APP_CONSTANTS.BRAND.NAME}</span>
        </h1>

        <div className="my-6">
          {/* OPTION 1: Using an image file */}
          <img 
            src="/icon.svg" 
            alt="Corener Logo" 
            className="h-20 w-20 mx-auto mb-4" 
          />
        </div>

        <p className="text-slate-300 text-lg md:text-xl mb-6 max-w-2xl mx-auto">
          {APP_CONSTANTS.WELCOME.SUBTITLE}
        </p>
        
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 inline-block mb-10">
          <p className="text-indigo-300 font-medium">
            <i className="fa-brands fa-discord mr-2"></i>
            {APP_CONSTANTS.WELCOME.CALL_TO_ACTION}
          </p>
        </div>

        {/* Communities Section */}
        <div className="border-t border-slate-800/80 pt-10">
          <h2 className="text-2xl font-bold text-white mb-3">
            {APP_CONSTANTS.WELCOME.COMMUNITIES_TITLE}
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            {APP_CONSTANTS.WELCOME.COMMUNITIES_TEXT}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* ETIC Link */}
            <a 
              href={APP_CONSTANTS.WELCOME.LINKS.ETIC.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#1e2743] hover:bg-[#253053] border border-slate-700 hover:border-indigo-500 transition-all duration-200 rounded-xl p-6 flex flex-col items-center"
            >
              <i className="fa-brands fa-discord text-4xl text-[#5865F2] mb-3 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-white font-bold text-lg">{APP_CONSTANTS.WELCOME.LINKS.ETIC.NAME}</h3>
              <p className="text-slate-400 text-sm mt-2">{APP_CONSTANTS.WELCOME.LINKS.ETIC.DESC}</p>
            </a>

            {/* THG Link */}
            <a 
              href={APP_CONSTANTS.WELCOME.LINKS.THG.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-[#1e2743] hover:bg-[#253053] border border-slate-700 hover:border-indigo-500 transition-all duration-200 rounded-xl p-6 flex flex-col items-center"
            >
              <i className="fa-brands fa-discord text-4xl text-[#5865F2] mb-3 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-white font-bold text-lg">{APP_CONSTANTS.WELCOME.LINKS.THG.NAME}</h3>
              <p className="text-slate-400 text-sm mt-2">{APP_CONSTANTS.WELCOME.LINKS.THG.DESC}</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Logged-In Dashboard View (Original Code)
 * Requires authentication to fetch data safely.
 */
const DashboardView = () => {
  const { teams, players, events, stats, isLoading, error } = useData();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-400">{APP_CONSTANTS.UI.ERROR_LOADING_DATA} {error}</div>;

  return (
    <div className="animate-fade-in">
      {/* ========================================
          HERO SECTION
          ======================================== */}
      <div className="bg-[#13192b] border border-slate-800/60 rounded-2xl p-10 text-center mb-8 shadow-xl">
        <h2 className="text-4xl font-black text-white mb-3 uppercase tracking-tight">
          {APP_CONSTANTS.HOME.MAIN_HEADING} <span className="text-indigo-400">{APP_CONSTANTS.HOME.MAIN_HEADING_ACCENT}</span>
        </h2>
        <p className="text-slate-400 text-lg">{APP_CONSTANTS.BRAND.SUBTITLE}</p>
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
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-black text-indigo-400 mb-1">{teams.length}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {APP_CONSTANTS.HOME.STATS.TEAMS_TRACKED}
          </div>
        </div>
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-black text-indigo-400 mb-1">{players.length}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {APP_CONSTANTS.HOME.STATS.PLAYERS_TRACKED}
          </div>
        </div>
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-black text-emerald-400 mb-1">{stats.eventsRecorded || 0}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {APP_CONSTANTS.HOME.STATS.EVENTS_RECORDED}
          </div>
        </div>
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-black text-amber-400 mb-1">{stats.regionsCovered || 0}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {APP_CONSTANTS.HOME.STATS.REGIONS_COVERED}
          </div>
        </div>
      </div>

      {/* ========================================
          CONTENT SECTIONS
          ======================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            <i className={`${APP_CONSTANTS.ICONS.NEWSPAPER} mr-2 text-indigo-400`}></i>
            {APP_CONSTANTS.HOME.SECTIONS.UPDATES}
          </h3>
          <NewsFeed limit={5} compact showViewAll />
        </div>
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            <i className={`${APP_CONSTANTS.ICONS.CALENDAR} text-indigo-400 mr-2`}></i>
            {APP_CONSTANTS.HOME.SECTIONS.UPCOMING_TOURNAMENTS}
          </h3>
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={index} className="p-3 bg-slate-950/60 border border-slate-900 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-200">{event.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700/60 font-bold px-1 rounded tracking-wide font-mono uppercase">
                      {event.gameType}
                    </span>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      {event.region}
                    </p>
                  </div>
                </div>
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

/**
 * Main Home Component
 * Conditionally renders the Welcome or Dashboard view based on auth state.
 */
const Home = () => {
  // Replace this line with how your app actually checks if a user is logged in
  const { user } = useAuth(); 

  // If user exists, show the data dashboard. Otherwise, show the static welcome page.
  return user ? <DashboardView /> : <WelcomeView />;
};

export default Home;