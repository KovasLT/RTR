// 6-team double elimination (single grand final).
// Upper bracket: seeds 1-4. Lower bracket starts at seeds 5-6.

export const initialBracketState = () => ({
    // ── Single elimination (kept for `playoffs` format) ──
    single: [
        {
            roundName: 'Quarterfinals',
            slots: [
                { label: 'A', matchId: '', placeholderA: 'Seed 1', placeholderB: 'Seed 8' },
                { label: 'B', matchId: '', placeholderA: 'Seed 4', placeholderB: 'Seed 5' },
                { label: 'C', matchId: '', placeholderA: 'Seed 3', placeholderB: 'Seed 6' },
                { label: 'D', matchId: '', placeholderA: 'Seed 2', placeholderB: 'Seed 7' },
            ],
        },
        {
            roundName: 'Semifinals',
            slots: [
                { label: 'E', matchId: '', placeholderA: 'A winner', placeholderB: 'B winner' },
                { label: 'F', matchId: '', placeholderA: 'C winner', placeholderB: 'D winner' },
            ],
        },
        {
            roundName: 'Finals',
            slots: [
                { label: 'G', matchId: '', placeholderA: 'E winner', placeholderB: 'F winner' },
            ],
        },
    ],

    // ── Upper bracket (2 rounds) ──
    upper: [
        {
            roundName: 'Upper Round 1',
            slots: [
                { label: 'A', matchId: '', placeholderA: 'Seed 1', placeholderB: 'Seed 4' },
                { label: 'B', matchId: '', placeholderA: 'Seed 2', placeholderB: 'Seed 3' },
            ],
        },
        {
            roundName: 'Upper Final',
            slots: [
                { label: 'C', matchId: '', placeholderA: 'A winner', placeholderB: 'B winner' },
            ],
        },
    ],

    // ── Lower bracket (3 rounds) ──
    lower: [
        {
            roundName: 'Lower Round 1',
            slots: [
                { label: 'D', matchId: '', placeholderA: 'Seed 5', placeholderB: 'A loser' },
                { label: 'E', matchId: '', placeholderA: 'Seed 6', placeholderB: 'B loser' },
            ],
        },
        {
            roundName: 'Lower Semifinal',
            slots: [
                { label: 'F', matchId: '', placeholderA: 'D winner', placeholderB: 'E winner' },
            ],
        },
        {
            roundName: 'Lower Final',
            slots: [
                { label: 'G', matchId: '', placeholderA: 'C loser', placeholderB: 'F winner' },
            ],
        },
    ],

    // ── Grand Finals ──
    grand: [
        {
            roundName: 'Grand Finals',
            slots: [
                { label: 'Finals', matchId: '', placeholderA: 'C winner', placeholderB: 'G winner' },
            ],
        },
    ],
});
