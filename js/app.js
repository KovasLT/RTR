/**
 * RTR Core Runtime Application Logic Module
 */

// Application Core Reactive Cache Datasets
let allTeams = [];
let allPlayers = [];
let currentRegionFilter = 'ALL';

// Application Bootstrap Entry Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeStaticPlatformLayout();
    loadApplicationDataStructure();
});

// Structural Navigation SPA Tab Routing
function switchTab(tabId) {
    // Structural Content Section Filtering Toggle
    document.querySelectorAll('.page-view').forEach(view => {
        view.classList.add('hidden');
        view.classList.remove('block');
    });

    const selectedView = document.getElementById(`view-${tabId}`);
    if (selectedView) {
        selectedView.classList.remove('hidden');
        selectedView.classList.add('block');
    }

    // Navigation Tab Component Context Swapping
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-indigo-400', 'border-indigo-500');
        btn.classList.add('text-slate-400', 'border-transparent');
    });

    const activeNavBtn = document.getElementById(`nav-${tabId}`);
    if (activeNavBtn) {
        activeNavBtn.classList.add('text-indigo-400', 'border-indigo-500');
        activeNavBtn.classList.remove('text-slate-400', 'border-transparent');
    }
}

// Global Core Asynchronous Data Fetch Handler Orchestrator
async function loadApplicationDataStructure() {
    try {
        // Fetch data safely, defaulting to empty arrays if the file is missing/fails
        let responseTeams = await fetch('data/teams.json').then(res => res.json()).catch(() => []);
        let responsePlayers = await fetch('data/players.json').then(res => res.json()).catch(() => []);

        // Defensive Check: If the JSON is wrapped in an object structure like { "teams": [...] }
        if (responseTeams && !Array.isArray(responseTeams) && responseTeams.teams) {
            responseTeams = responseTeams.teams;
        }
        if (responsePlayers && !Array.isArray(responsePlayers) && responsePlayers.players) {
            responsePlayers = responsePlayers.players;
        }

        // Process data sorting by absolute algorithmic rating values descending
        allTeams = responseTeams.sort((a, b) => b.rating - a.rating);
        allPlayers = responsePlayers.sort((a, b) => b.rating - a.rating);

        // Calculate home layout metric values (ensure elements exist before updating)
        const statTeamsEl = document.getElementById('stat-teams');
        const statPlayersEl = document.getElementById('stat-players');
        if (statTeamsEl) statTeamsEl.innerText = allTeams.length;
        if (statPlayersEl) statPlayersEl.innerText = allPlayers.length;

        // Render runtime arrays to DOM views
        renderRegionFilters();
        renderTeamsLeaderboard();
        renderPlayersLeaderboard();

    } catch (dataProcessError) {
        console.error("Critical error mapping platform core arrays:", dataProcessError);
    }
}


// Generate Regional Context Active Filtering System Row
function renderRegionFilters() {
    const filterRow = document.getElementById('region-filters-teams');
    if (!filterRow) return;

    const availableRegions = ['ALL', 'WEU', 'EEU', 'MENA'];

    filterRow.innerHTML = availableRegions.map(regionKey => {
        const isCurrent = currentRegionFilter === regionKey;
        const stateClasses = isCurrent
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60';
        return `<button onclick="setRegionFilter('${regionKey}')" class="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${stateClasses}">${regionKey}</button>`;
    }).join('');
}

function setRegionFilter(selectedRegion) {
    currentRegionFilter = selectedRegion;
    renderRegionFilters();
    renderTeamsLeaderboard();
}

// Compute Trend Signatures for Display Tables
function getTrendTemplate(movementStr) {
    if (!movementStr || movementStr === '0' || movementStr.toLowerCase() === 'neutral') {
        return `<span class="trend-neutral">▬</span>`;
    }
    if (movementStr.startsWith('+') || movementStr.startsWith('↑')) {
        const val = movementStr.replace(/[+↑]/g, '');
        return `<span class="trend-up"><i class="fa-solid fa-caret-up mr-1"></i>${val}</span>`;
    }
    if (movementStr.startsWith('-') || movementStr.startsWith('↓')) {
        const val = movementStr.replace(/[-↓]/g, '');
        return `<span class="trend-down"><i class="fa-solid fa-caret-down mr-1"></i>${val}</span>`;
    }
    return `<span class="trend-neutral">${movementStr}</span>`;
}

// Render Complete Team Database Content Grid
function renderTeamsLeaderboard() {
    const tbody = document.getElementById('teams-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    let analyticalRankCount = 1;

    allTeams.forEach(team => {
        if (currentRegionFilter !== 'ALL' && team.region !== currentRegionFilter) return;

        let statusMarkerStyle = 'bg-rose-500';
        if (team.status === 'active') statusMarkerStyle = 'bg-emerald-500 animate-pulse';
        else if (team.status === 'inactive') statusMarkerStyle = 'bg-amber-500';

        // Ensure flag data exists, default to 'un' (United Nations/Unknown) if missing
        const flagCode = team.flag ? team.flag.toLowerCase() : 'un';

        tbody.innerHTML += `
        <tr class="rtr-table-row hover:bg-slate-900/40 transition">
        <td class="px-6 py-4 font-bold text-slate-400 font-mono">${analyticalRankCount++}</td>
        <td class="px-6 py-4 text-center text-xs">${getTrendTemplate(team.movement)}</td>
        <td class="px-6 py-4">
        <div class="flex items-center space-x-2.5">
        <img src="https://flagcdn.com/${flagCode}.svg" width="20" class="rounded-[2px] shadow-sm" alt="${team.flag} flag" title="${team.countryName || team.flag}">
        <span class="text-white font-bold tracking-wide">${team.name}</span>
        </div>
        </td>
        <td class="px-6 py-4"><span class="bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider">${team.region}</span></td>
        <td class="px-6 py-4 font-mono font-black text-indigo-400">${team.rating}</td>
        <td class="px-6 py-4 font-mono text-slate-400 text-xs">${team.wins}W - ${team.losses}L</td>
        <td class="px-6 py-4 font-mono text-slate-300 text-xs">${team.winRate}</td>
        <td class="px-6 py-4 text-xs text-slate-400">
        <div class="flex items-center space-x-2">
        <span class="h-2 w-2 rounded-full ${statusMarkerStyle} inline-block"></span>
        <span class="font-medium text-[11px] text-slate-400">${team.lastActive}</span>
        </div>
        </td>
        </tr>
        `;
    });
}

// Render Complete Individual Player Rankings Data Model Row Elements
function renderPlayersLeaderboard() {
    const tbody = document.getElementById('players-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    let rankIndex = 1;

    allPlayers.forEach(player => {
        // Handle flag formatting
        const flagCode = player.flag ? player.flag.toLowerCase() : 'un';

        tbody.innerHTML += `
        <tr class="rtr-table-row hover:bg-slate-900/40 transition">
        <td class="px-6 py-4 font-bold text-slate-400 font-mono">${rankIndex++}</td>
        <td class="px-6 py-4 text-center text-xs">${getTrendTemplate(player.movement)}</td>
        <td class="px-6 py-4">
        <div class="flex items-center space-x-2.5">
        <img src="https://flagcdn.com/${flagCode}.svg" width="20" class="rounded-[2px] shadow-sm" alt="${player.flag} flag">
        <span class="font-bold text-white tracking-wide">${player.name}</span>
        </div>
        </td>
        <td class="px-6 py-4">
        <span class="text-slate-400 font-mono text-[11px] uppercase tracking-wider bg-slate-800 px-1.5 py-0.5 rounded">${player.flag}</span>
        </td>
        <td class="px-6 py-4 text-slate-400 text-xs font-semibold">${player.role}</td>
        <td class="px-6 py-4 text-slate-400 text-xs font-semibold">${player.team}</td>
        <td class="px-6 py-4 font-mono font-black text-indigo-400">${player.rating}</td>
        </tr>
        `;
    });
}

// Construct Static UI Text Panels For Home and Infrastructure Nodes
function initializeStaticPlatformLayout() {
    const newsBox = document.getElementById('home-news-container');
    if (newsBox) {
        const structuralNewsFeed = [
            { date: "June 2, 2026", title: "Regional Calibration Cycle Finalized", desc: "Data parameters mapped securely across core WEU and EEU regional tournament splits." },
            { date: "May 28, 2026", title: "National Conduits Pipeline Integration", desc: "Structured data parameters now include country tags for national coach scouting rosters." }
        ];
        newsBox.innerHTML = structuralNewsFeed.map(news => `
        <div class="border-l-2 border-indigo-500/80 pl-4 py-0.5">
        <p class="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">${news.date}</p>
        <h4 class="text-sm font-bold text-slate-200 mt-0.5">${news.title}</h4>
        <p class="text-xs text-slate-400 mt-1 leading-relaxed">${news.desc}</p>
        </div>
        `).join('');
    }

    const eventBox = document.getElementById('home-events-container');
    if (eventBox) {
        const eventsMockData = [
            { label: "Community Invitational #4", reg: "EEU Region", countdown: "In 2 days", tech: "HOK" },
            { label: "Masters Grassroots Cup", reg: "WEU Open Area", countdown: "In 5 days", tech: "MOBA" }
        ];
        eventBox.innerHTML = eventsMockData.map(ev => `
        <div class="p-3 bg-slate-950/60 border border-slate-900 rounded-lg flex justify-between items-center">
        <div>
        <p class="text-xs font-bold text-slate-200">${ev.label}</p>
        <div class="flex items-center gap-2 mt-1">
        <span class="text-[9px] bg-slate-800 text-slate-400 border border-slate-700/60 font-bold px-1 rounded tracking-wide font-mono uppercase">${ev.tech}</span>
        <p class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">${ev.reg}</p>
        </div>
        </div>
        <span class="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded tracking-wide uppercase">${ev.countdown}</span>
        </div>
        `).join('');
    }

    const mappingStreamers = ['RTR_Casts', 'EsportsObserver_EU'];
    document.getElementById('community-streamers').innerHTML = mappingStreamers.map(s => `<li><a href="#" class="hover:text-indigo-400 flex items-center justify-between py-1 border-b border-slate-900"><span><i class="fab fa-twitch text-purple-500 mr-2 opacity-80"></i>${s}</span> <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-slate-600"></i></a></li>`).join('');

    const mappingDiscords = ['RTR Regional Hub', 'Vindex EU Central'];
    document.getElementById('community-discords').innerHTML = mappingDiscords.map(d => `<li><a href="#" class="hover:text-indigo-400 flex items-center justify-between py-1 border-b border-slate-900"><span><i class="fab fa-discord text-indigo-400 mr-2 opacity-80"></i>${d}</span> <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-slate-600"></i></a></li>`).join('');

    const mappingOrganizers = ['Baltic Esports Fed', 'AQUA Grassroots Org'];
    document.getElementById('community-organizers').innerHTML = mappingOrganizers.map(o => `<li><a href="#" class="hover:text-indigo-400 flex items-center justify-between py-1 border-b border-slate-900"><span><i class="fa-solid fa-trophy text-amber-500 mr-2 opacity-80"></i>${o}</span> <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-slate-600"></i></a></li>`).join('');

    const mappingContributors = ['Admin Zero (Database)', 'Mantas P. (Analyst)'];
    document.getElementById('community-contributors').innerHTML = mappingContributors.map(c => `<li class="py-1 border-b border-slate-900 text-slate-300 flex items-center gap-2"><span><i class="fa-solid fa-user-gear text-emerald-400 text-[10px] opacity-80"></i>${c}</span></li>`).join('');
}

// Local Fallback Array Modules
function getLocalTeamsMockFallback() {
    return [
        { "name": "Baltic Wolves", "flag": "🇱🇹", "countryName": "Lithuania", "region": "EEU", "rating": 1842, "wins": 24, "losses": 6, "winRate": "80%", "movement": "+3", "status": "active", "lastActive": "2 days ago" },
        { "name": "Desert Falcons", "flag": "🇸🇦", "countryName": "Saudi Arabia", "region": "MENA", "rating": 1794, "wins": 20, "losses": 8, "winRate": "71%", "movement": "-1", "status": "active", "lastActive": "1 day ago" },
        { "name": "Vindex EU", "flag": "🇪🇺", "countryName": "Europe", "region": "WEU", "rating": 1710, "wins": 18, "losses": 11, "winRate": "62%", "movement": "0", "status": "active", "lastActive": "3 hours ago" }
    ];
}

function getLocalPlayersMockFallback() {
    return [
        { "name": "Medeina", "flag": "🇱🇹", "countryCode": "LT", "team": "Baltic Wolves", "rating": 1932, "movement": "+5" },
        { "name": "Jan", "flag": "🇵🇱", "countryCode": "PL", "team": "Eastern Legion", "rating": 1898, "movement": "+2" },
        { "name": "Kovas", "flag": "🇱🇹", "countryCode": "LT", "team": "Vindex EU", "rating": 1812, "movement": "-3" }
    ];
}
