# Graph Report - RTR  (2026-06-17)

## Corpus Check
- 96 files · ~64,086 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 222 nodes · 247 edges · 10 communities detected
- Extraction: 60% EXTRACTED · 40% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 25 edges
2. `ScoutPanel()` - 7 edges
3. `useRegions()` - 7 edges
4. `ProfileView()` - 7 edges
5. `PlayerPanel()` - 6 edges
6. `useLanes()` - 6 edges
7. `useRanks()` - 6 edges
8. `useMyTeams()` - 6 edges
9. `Players()` - 6 edges
10. `ProfileEdit()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `News()` --calls--> `useAuth()`  [INFERRED]
  src\pages\News.jsx → src\hooks\useAuth.jsx
- `AddStaff()` --calls--> `useDirectory()`  [INFERRED]
  src\pages\TeamManage.jsx → src\hooks\useProfiles.js
- `Players()` --calls--> `usePlayerRankings()`  [INFERRED]
  src\pages\Players.jsx → src\hooks\useRankings.js
- `HomeRoute()` --calls--> `useAuth()`  [INFERRED]
  src\App.jsx → src\hooks\useAuth.jsx
- `Header()` --calls--> `useChat()`  [INFERRED]
  src\components\Header.jsx → src\components\ChatContext.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (17): ChatWindow(), Header(), MessageInbox(), useAuth(), useConversations(), useMessages(), useUnreadCount(), useAllTeams() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (13): TeamManagerPanel(), TournamentsPanel(), useMyApplications(), useMyMemberships(), useMyTeams(), useTeam(), useTeamMutations(), Dashboard() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (8): useChat(), CoachPanel(), PlayerPanel(), usePlayerMutations(), useProfile(), useRatingHistory(), useMyStaffTeams(), PlayerPage()

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (11): authorName(), NewsCard(), NewsFeed(), useApprovedNews(), useMyNews(), useNewsMutations(), usePendingNews(), ModerationQueue() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.27
Nodes (10): ScoutPanel(), useDirectory(), fetchTable(), useHeroes(), useLanes(), useRanks(), useRegions(), Directory() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (7): AdminOverview(), AdminRatings(), AdminUsers(), useAdminMutations(), useAdminStats(), useAdminUsers(), useRatingEvents()

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (6): useData(), usePlayerRankings(), useTeamRankings(), Community(), Home(), Teams()

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (5): useEndorsementMutations(), useEndorsements(), useMyWatchlist(), useScoutMutations(), ProfileView()

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (2): MatchCard(), getParticipantName()

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (3): AuthProvider(), mapUser(), isSupabaseConfigured()

## Knowledge Gaps
- **Thin community `Community 8`** (5 nodes): `BracketRenderer.jsx`, `utils.js`, `BracketRenderer()`, `MatchCard()`, `getParticipantName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`?**
  _High betweenness centrality (0.360) - this node is a cross-community bridge._
- **Why does `News()` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `AdminUsers()` connect `Community 5` to `Community 0`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `useAuth()` (e.g. with `HomeRoute()` and `ChatWindow()`) actually correct?**
  _`useAuth()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `ScoutPanel()` (e.g. with `useMyWatchlist()` and `useScoutMutations()`) actually correct?**
  _`ScoutPanel()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `useRegions()` (e.g. with `ScoutPanel()` and `Directory()`) actually correct?**
  _`useRegions()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `ProfileView()` (e.g. with `useAuth()` and `useProfile()`) actually correct?**
  _`ProfileView()` has 6 INFERRED edges - model-reasoned connections that need verification._