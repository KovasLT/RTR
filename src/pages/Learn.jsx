// pages/Learn.jsx
const Learn = () => {
  return (
    <div className="learn-hub space-y-12">
      {/* Community Resources & Tools */}
      <section className="topic-category">
        <h2 className="text-2xl font-bold text-white mb-4">Community Resources & Tools</h2>
        <div className="cards-grid grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">Art of Moba by Kovas</h3>
            <p className="text-gray-300 text-sm mt-1">Handbook covering everything you need to know to play in a community team — rotations, tactics, tricks, terminology, and more.</p>
            <a href="https://kovaslt.github.io/art-of-moba/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Read the Handbook &rarr;
            </a>
          </div>
          <div className="guide-card rtr-card">
            <h3 className="text-lg font-semibold text-white">MOBA Tactical Board by Kovas</h3>
            <p className="text-gray-300 text-sm mt-1">A tool for coaches to make plans and explain tactics easier. Features winrate estimation, synergy, counter schemes, free hero movement, animated states, and drawing of arrows, circles, and paths.</p>
            <a href="file:///C:/Users/98and/OneDrive/Stalinis%20kompiuteris/Corener.eu/moba-tactical-board/index.html" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
              Open the Tool &rarr;
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Learn;