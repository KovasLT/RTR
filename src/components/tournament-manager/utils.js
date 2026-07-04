export const getParticipantName = (id, participants, tournamentType) => {
    if (!id) return "TBD";
    const p = participants.find(part => (part.team_id === id || part.player_id === id));
    if (!p) return "Unknown";
    if (tournamentType === 'team') {
        return `${p.teams?.name || '?'} ${p.teams?.tag ? `[${p.teams.tag}]` : ''}`;
    } else {
        return p.profiles?.display_name || p.profiles?.handle || 'Unknown Player';
    }
};
