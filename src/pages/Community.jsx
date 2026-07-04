import { APP_CONSTANTS } from '../app-constants';

const Community = () => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">
        {APP_CONSTANTS.COMMUNITY?.PAGE_TITLE || 'Chronicles of Corener'}
      </h2>

      <div className="bg-[#13192b] border border-slate-800 rounded-xl p-6 md:p-8 space-y-10 shadow-lg">
        
        {/* Chapter 1: The Scattered Realms */}
        <section className="space-y-4 text-slate-300 leading-relaxed">
          <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            Chapter I: The Age of Echoing Halls
          </h3>
          <p>
            A long, long time ago — well, it was 2026, but in internet years that’s practically a century — the competitive MOBA landscape looked less like a unified continent and more like a bag of quarrelling squirrels. Every Discord server was an isolated fortress. One team would win a weekend tournament (possibly because the enemy jungler’s cat unplugged the router), and by Monday morning they’d crowned themselves “Undisputed Rulers of All Europe.”
          </p>
          <p>
            Meanwhile, in another server three clicks away, a completely different guild was doing the exact same thing, blissfully unaware that their so‑called “legendary carry” had a 30% win rate anywhere that wasn’t a custom lobby with wonky rules. There were no shared leaderboards, no cross‑community rankings, and absolutely zero way to verify if someone’s epic highlight reel reflected actual skill or just really good luck against five strangers who had never played together before.
          </p>
          <p className="italic text-slate-400">
            Spoiler: it was usually the luck.
          </p>
        </section>

        {/* Chapter 2: The Fellowship of the Core */}
        <section className="space-y-4 text-slate-300 leading-relaxed">
          <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            Chapter II: The Fellowship of the Core
          </h3>
          <p>
            From the chaos rose three battle‑hardened guild masters, each scarred by years of tournament organizing and endless “is this seed rigged?” accusations. They ran thriving communities across Europe and beyond, and they shared a common dream: one place, one rating, one great hall where every warrior could test their steel and nobody could claim a title without earning it.
          </p>
          <p>
            They saw the scattered tournaments as wild, untamed beasts — each a legendary creature waiting to be hunted. Each hunt drew brave teams, but the trophies roamed alone, never part of a single, shared saga. The three masters knew: it was time to unite the hunts.
          </p>
          
          {/* Founder cards integrated into the chapter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-[#0b0e17] border border-slate-800/60 rounded-lg p-4 flex flex-col items-center hover:border-slate-700 transition-colors">
              <span className="text-emerald-400 font-bold text-lg mb-1">DEC4Y</span>
              <span className="text-xs text-slate-400 mb-2">THG Grand Marshall</span>
              <p className="text-xs text-slate-500 text-center">Bracket sensei. Has probably organized a tournament while waiting for a bus.</p>
            </div>
            <div className="bg-[#0b0e17] border border-slate-800/60 rounded-lg p-4 flex flex-col items-center hover:border-slate-700 transition-colors">
              <span className="text-emerald-400 font-bold text-lg mb-1">SLaYeR ReBoRN 👾</span>
              <span className="text-xs text-slate-400 mb-2">Code Architect</span>
              <p className="text-xs text-slate-500 text-center">Turns caffeine into websites. If something breaks, he’s already fixing it before you tweet.</p>
            </div>
            <div className="bg-[#0b0e17] border border-slate-800/60 rounded-lg p-4 flex flex-col items-center hover:border-slate-700 transition-colors">
              <span className="text-emerald-400 font-bold text-lg mb-1">Kovas</span>
              <span className="text-xs text-slate-400 mb-2">ETIC Lord of Ratings</span>
              <p className="text-xs text-slate-500 text-center">Sees ELO numbers in his dreams. <a href="https://discord.gg/EwJeezZuA7" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">ETIC community</a>.</p>
            </div>
          </div>

          <p className="mt-4">
            Around a virtual campfire (fueled by questionable energy drinks), these three made a vow: to build the core of a new competitive world — a stronghold where scattered tournaments unite, where players find real teammates, and where the path from casual to pro isn’t locked behind who you know but measured by what you prove.
          </p>
        </section>

        {/* Chapter 3: The Birth of Corener.eu */}
        <section className="space-y-4 text-slate-300 leading-relaxed">
          <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            Chapter III: The Stronghold Takes Form
          </h3>
          <p>
            Thus <strong className="text-indigo-400">Corener.eu</strong> was forged — not as a cold, faceless platform, but as a welcoming hearth for every MOBA player tired of hopping between 14 Discords just to find a single scrim. We’re the core of the community: a place where you can track your progress without a decoder ring, find a team that actually communicates (most of the time), and experience tournaments run by people who genuinely love the game — not by algorithm.
          </p>
          <p>
            Our mission is simple but ambitious. We help players grow, find their tribe, and maybe — just maybe — take their first steps toward a real competitive career. No secret handshakes, no locked doors. Just honest competition, friendly banter, and the occasional meme about your ill‑fated tower dive.
          </p>
          <p>
            The long‑term vision? Evolve from a community stronghold into a full‑fledged, sustainable esports league — a proving ground where tomorrow’s pro stars are born, and where the phrase “I’m the best” actually comes with a leaderboard link. A competitive realm where passion meets structure, and every match brings you closer to a future in esports — without the anonymous rage whispers you’d find elsewhere.
          </p>
        </section>

        {/* Chapter 4: The Unforgiving Scrolls */}
        <section className="space-y-4 text-slate-300 leading-relaxed">
          <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            Chapter IV: The Ledger That Never Forgets
          </h3>
          <p>
            To end the age of self‑proclaimed champions, the founders invoked an ancient and impartial magic: the <a href="https://en.wikipedia.org/wiki/Elo_rating_system" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">ELO rating system</a>. This sacred scroll does not care if your screen froze, if the pizza delivery arrived mid‑teamfight, or if you were “just limit‑testing a new build.” It simply records what happened.
          </p>
          <p>
            Every official match nudges your rating up or down with merciless precision. The leaderboard becomes your legacy — a story written in numbers, not excuses. Whether you climb as a lone wolf or a coordinated five‑stack, the ledger remembers all. And while that can sting after a bad game, it also means the glory is real and no one can take it from you.
          </p>
        </section>

        {/* Chapter 5: The Call to Arms */}
        <section className="space-y-4 text-slate-300 leading-relaxed">
          <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            Chapter V: Your Banner Awaits
          </h3>
          <p>
            The gates of <strong className="text-indigo-400">Corener.eu</strong> stand wide open. Whether you’re a solo adventurer seeking a fellowship, a battle‑hardened captain scouting rivals, or an entire roster itching to prove your banner isn’t just for show — there’s a seat at our table for you.
          </p>
          <p>
            We run regular tournaments, we track your saga, and we give you a stage where every great play (and every hilarious whiff) becomes part of a shared story. And because we’re built by the community for the community, we’re always open to new alliances.
          </p>
          <p>
            <strong className="text-white">A word of transparency:</strong> Corener.eu is a <em>community‑run</em> project, created by players for players. We are not affiliated with any official game publisher or developer. We are an independent hub focused purely on uniting the MOBA community and helping gamers grow. That said, we warmly welcome MOBA game developers to reach out if they see a potential partnership — we’d love to collaborate and build something even greater together.
          </p>
        </section>

        {/* Final Invitation */}
        <section className="pt-6 border-t border-slate-800/80 text-center space-y-3">
          <p className="text-slate-300 italic">
            This is the core. Your story starts here. Welcome to <strong className="text-indigo-400">Corener.eu</strong>.
          </p>
        </section>

      </div>
    </div>
  );
};

export default Community;