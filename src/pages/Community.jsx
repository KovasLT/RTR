import { useData } from '../hooks/useData';
import LoadingSpinner from '../components/LoadingSpinner';
import { APP_CONSTANTS } from '../app-constants';

const Community = () => {
  const { community, isLoading, error } = useData();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-400">{APP_CONSTANTS.UI.ERROR_LOADING_DATA} {error}</div>;

  const {
    streamers = [],
    discords = [],
    organizers = [],
    contributors = []
  } = community;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">{APP_CONSTANTS.COMMUNITY.PAGE_TITLE}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            {APP_CONSTANTS.COMMUNITY.SECTIONS.DISCORD_SERVERS}
          </h3>
          <ul className="text-sm text-slate-400 space-y-1">
            {discords.map((discord, index) => (
              <li key={index}>
                <a
                  href="#"
                  className="hover:text-indigo-400 flex items-center justify-between py-1 border-b border-slate-900"
                >
                  <span>
                    <i className={`${APP_CONSTANTS.ICONS.DISCORD} text-indigo-400 mr-2 opacity-80`}></i>
                    {discord}
                  </span>
                  <i className={`${APP_CONSTANTS.ICONS.ARROW_EXTERNAL} text-[9px] text-slate-600`}></i>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            {APP_CONSTANTS.COMMUNITY.SECTIONS.COMMUNITY_EVENTS}
          </h3>
          <ul className="text-sm text-slate-400 space-y-1">
            {organizers.map((organizer, index) => (
              <li key={index}>
                <a
                  href="#"
                  className="hover:text-indigo-400 flex items-center justify-between py-1 border-b border-slate-900"
                >
                  <span>
                    <i className={`${APP_CONSTANTS.ICONS.TROPHY} text-amber-500 mr-2 opacity-80`}></i>
                    {organizer}
                  </span>
                  <i className={`${APP_CONSTANTS.ICONS.ARROW_EXTERNAL} text-[9px] text-slate-600`}></i>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            {APP_CONSTANTS.COMMUNITY.SECTIONS.POPULAR_STREAMERS}
          </h3>
          <ul className="text-sm text-slate-400 space-y-1">
            {streamers.map((streamer, index) => (
              <li key={index}>
                <a
                  href="#"
                  className="hover:text-indigo-400 flex items-center justify-between py-1 border-b border-slate-900"
                >
                  <span>
                    <i className={`${APP_CONSTANTS.ICONS.TWITCH} text-purple-500 mr-2 opacity-80`}></i>
                    {streamer}
                  </span>
                  <i className={`${APP_CONSTANTS.ICONS.ARROW_EXTERNAL} text-[9px] text-slate-600`}></i>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#13192b] border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            {APP_CONSTANTS.COMMUNITY.SECTIONS.TOP_CONTRIBUTORS}
          </h3>
          <ul className="text-sm text-slate-400 space-y-1">
            {contributors.map((contributor, index) => (
              <li key={index} className="py-1 border-b border-slate-900 text-slate-300 flex items-center gap-2">
                <span>
                  <i className={`${APP_CONSTANTS.ICONS.USER_GEAR} text-emerald-400 text-[10px] opacity-80`}></i>
                  {contributor}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Community;