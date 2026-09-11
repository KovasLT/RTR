// components/tournament-manager/bracketDefaults.js
// Single source of truth for bracket structures + placeholder labels.

export const initialBracketState = () => ({
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

    upper: [
        {
            roundName: 'UB Quarterfinals',
            slots: [
                { label: 'A', matchId: '', placeholderA: 'Seed 1', placeholderB: 'Seed 8' },
                { label: 'B', matchId: '', placeholderA: 'Seed 4', placeholderB: 'Seed 5' },
                { label: 'C', matchId: '', placeholderA: 'Seed 3', placeholderB: 'Seed 6' },
                { label: 'D', matchId: '', placeholderA: 'Seed 2', placeholderB: 'Seed 7' },
            ],
        },
        {
            roundName: 'UB Semifinals',
            slots: [
                { label: 'E', matchId: '', placeholderA: 'A winner', placeholderB: 'B winner' },
                { label: 'F', matchId: '', placeholderA: 'C winner', placeholderB: 'D winner' },
            ],
        },
        {
            roundName: 'UB Finals',
            slots: [
                { label: 'G', matchId: '', placeholderA: 'E winner', placeholderB: 'F winner' },
            ],
        },
    ],

    lower: [
        {
            roundName: 'LB Round 1',
            slots: [
                { label: 'H', matchId: '', placeholderA: 'A loser', placeholderB: 'B loser' },
                { label: 'I', matchId: '', placeholderA: 'C loser', placeholderB: 'D loser' },
            ],
        },
        {
            roundName: 'LB Round 2',
            slots: [
                { label: 'J', matchId: '', placeholderA: 'E loser', placeholderB: 'H winner' },
                { label: 'K', matchId: '', placeholderA: 'F loser', placeholderB: 'I winner' },
            ],
        },
        {
            roundName: 'LB Round 3',
            slots: [
                { label: 'L', matchId: '', placeholderA: 'J winner', placeholderB: 'K winner' },
            ],
        },
        {
            roundName: 'LB Finals',
            slots: [
                { label: 'M', matchId: '', placeholderA: 'G loser', placeholderB: 'L winner' },
            ],
        },
    ],

    grand: [
        {
            roundName: 'Grand Finals',
            slots: [
                { label: 'N', matchId: '', placeholderA: 'G winner', placeholderB: 'M winner' },
            ],
        },
    ],
});
