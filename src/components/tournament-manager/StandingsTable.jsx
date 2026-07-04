export default function StandingsTable({ standings }) {
  return (
    <table className="w-full text-left text-sm text-gray-400">
      <thead className="text-xs text-gray-500 uppercase bg-gray-900/50 border-b border-gray-800">
        <tr>
          <th className="px-4 py-3">Rank</th>
          <th className="px-4 py-3">Participant</th>
          <th className="px-4 py-3 text-center">Played</th>
          <th className="px-4 py-3 text-center">W</th>
          <th className="px-4 py-3 text-center">L</th>
          <th className="px-4 py-3 text-center text-indigo-400">Points</th>
        </tr>
      </thead>
      <tbody>
        {standings.length === 0 ? (
          <tr>
            <td colSpan="6" className="text-center py-6 text-gray-600">
              No data. Add match scores via Match Pool tab.
            </td>
          </tr>
        ) : (
          standings.map((stat, idx) => (
            <tr key={stat.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
              <td className="px-4 py-3 font-bold text-gray-500">#{idx + 1}</td>
              <td className="px-4 py-3 font-semibold text-white">{stat.name}</td>
              <td className="px-4 py-3 text-center">{stat.played}</td>
              <td className="px-4 py-3 text-center text-green-500">{stat.w}</td>
              <td className="px-4 py-3 text-center text-red-500">{stat.l}</td>
              <td className="px-4 py-3 text-center font-bold text-indigo-400">{stat.pts}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}