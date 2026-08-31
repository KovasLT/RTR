// pages/Learn.jsx
const Learn = () => {
  return (
    <div className="learn-hub space-y-12">
      {/* Drafting, Team Compositions & Counter-Picking */}
      <section className="topic-category">
        <h2 className="text-2xl font-bold text-white mb-4">Drafting, Team Compositions & Counter-Picking</h2>
        <div className="cards-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Draft Fundamentals</h3>
            <p className="text-gray-300 text-sm mt-1">Building balanced front-to-back comps, identifying synergy pairs, and securing win conditions.</p>
            <a href="https://www.youtube.com/watch?v=CrlrHax16Sc" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Pro Coach Masterclass</h3>
            <p className="text-gray-300 text-sm mt-1">High-level championship drafting strategies and neutralizing enemy hyper-carries.</p>
            <a href="https://www.youtube.com/watch?v=iiq2VGYaeks" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Support & Roamer Selection</h3>
            <p className="text-gray-300 text-sm mt-1">Choosing between engage tanks, healers, and roamer damage dealers based on enemy lineups.</p>
            <a href="https://www.youtube.com/watch?v=KpuSaGU9jfs" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Wave Management & Minion Tactics */}
      <section className="topic-category">
        <h2 className="text-2xl font-bold text-white mb-4">Wave Management & Minion Tactics</h2>
        <div className="cards-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Lane Freezing</h3>
            <p className="text-gray-300 text-sm mt-1">Denying enemy gold and experience by holding minions right outside your tower range.</p>
            <a href="https://www.youtube.com/watch?v=viGRD5Mp7zs" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Slow Pushing & Wave Crashing</h3>
            <p className="text-gray-300 text-sm mt-1">Stacking massive minion waves to set up turret dives, roam timers, or secure neutral objectives.</p>
            <a href="https://www.youtube.com/watch?v=XDZ1JXp-BAk" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Proxying</h3>
            <p className="text-gray-300 text-sm mt-1">Clearing minion waves behind enemy towers to break freeze locks and generate intense map pressure.</p>
            <a href="https://www.youtube.com/watch?v=Ttfd93sEUHc" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Micro-Mechanics & Combat Positioning */}
      <section className="topic-category">
        <h2 className="text-2xl font-bold text-white mb-4">Micro-Mechanics & Combat Positioning</h2>
        <div className="cards-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Kiting & Auto-Spacing</h3>
            <p className="text-gray-300 text-sm mt-1">Maximizing damage output while staying strictly out of the enemy's attack range.</p>
            <a href="https://www.youtube.com/watch?v=6A-q-YmVl54" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Last Hitting Mechanics</h3>
            <p className="text-gray-300 text-sm mt-1">Securing maximum economy under pressure and executing under-tower farming techniques.</p>
            <a href="https://www.youtube.com/watch?v=iXYvpQhYsug" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Tethering & Cooldown Baiting</h3>
            <p className="text-gray-300 text-sm mt-1">Managing maximum ability ranges to force enemy skillshots to miss without taking damage.</p>
            <a href="https://www.youtube.com/watch?v=X_ohowIi4OI" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Macro Strategy, Map Control & Rotations */}
      <section className="topic-category">
        <h2 className="text-2xl font-bold text-white mb-4">Macro Strategy, Map Control & Rotations</h2>
        <div className="cards-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Lane Swapping</h3>
            <p className="text-gray-300 text-sm mt-1">Trading side lanes early to avoid counter-matchups, accelerate snowballing, or secure cross-map objectives.</p>
            <a href="https://www.youtube.com/watch?v=dPzZM6SX_vU" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Tempo & Cross-Mapping</h3>
            <p className="text-gray-300 text-sm mt-1">Trading map objectives on opposite sides when the enemy team heavily concentrates their forces.</p>
            <a href="https://www.youtube.com/watch?v=eR1W2LM12NU" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Mid Priority & Roaming</h3>
            <p className="text-gray-300 text-sm mt-1">Shoving the middle wave to unlock river access, create gank paths, and execute jungle invades.</p>
            <a href="https://www.youtube.com/watch?v=d374b4NMtyQ" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Jungle Pathing & Objective Setups */}
      <section className="topic-category">
        <h2 className="text-2xl font-bold text-white mb-4">Jungle Pathing & Objective Setups</h2>
        <div className="cards-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Jungle Pathing & Efficiency</h3>
            <p className="text-gray-300 text-sm mt-1">Optimizing clear speeds, identifying gank windows, and tracking the enemy jungler.</p>
            <a href="https://www.youtube.com/watch?v=yazgx_MCIbo" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Jungle Mistakes</h3>
            <p className="text-gray-300 text-sm mt-1">Fixing common pathing inefficiencies, wasted downtime, and objective timing errors.</p>
            <a href="https://youtu.be/IlKgBJPY2dk?feature=shared" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Objective Securing</h3>
            <p className="text-gray-300 text-sm mt-1">Managing burst damage and timing smite/punish executes for major neutral bosses.</p>
            <a href="https://www.youtube.com/watch?v=Qb3thwSLLVA" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Vision Control & Fog of War Execution */}
      <section className="topic-category">
        <h2 className="text-2xl font-bold text-white mb-4">Vision Control & Fog of War Execution</h2>
        <div className="cards-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Zoning & Bush Setup</h3>
            <p className="text-gray-300 text-sm mt-1">Controlling vision chokepoints 30-45 seconds before major objectives spawn to establish area denial.</p>
            <a href="https://www.youtube.com/watch?v=q1__MfxtLVQ" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Objective Baiting</h3>
            <p className="text-gray-300 text-sm mt-1">Utilizing vision delay and skill checks to set up instant death-bushes and force enemy face-checks.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <a href="https://www.youtube.com/watch?v=qHpV5BKlQQA" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm">
                Watch Tutorial (HoK) &rarr;
              </a>
              <a href="https://www.youtube.com/watch?v=poJG1xUDyps" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm">
                Watch Tutorial (MLBB) &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Late-Game Execution & Base Sieging */}
      <section className="topic-category">
        <h2 className="text-2xl font-bold text-white mb-4">Late-Game Execution & Base Sieging</h2>
        <div className="cards-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Split Pushing Tactics</h3>
            <p className="text-gray-300 text-sm mt-1">Executing 1-3-1 or 4-1 side-lane pressure correctly without getting caught out of position.</p>
            <a href="https://www.youtube.com/watch?v=eR1W2LM12NU" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Ending the Game</h3>
            <p className="text-gray-300 text-sm mt-1">How to safely break high-ground defense, manage super minion waves, and close out matches cleanly.</p>
            <a href="https://www.youtube.com/watch?v=w4c_ZNyTgG0" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Mirroring</h3>
            <p className="text-gray-300 text-sm mt-1">Explains the mirroring.</p>
            <a href="https://www.youtube.com/watch?v=5GaPlrLYArw" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Watch Tutorial &rarr;
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Learn;