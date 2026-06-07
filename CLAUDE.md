# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RTR (Rising Teams Rating) is a modern React application for tracking esports community rankings. Built with React 19, React Router, Tailwind CSS, and Vite for optimal performance with code splitting and CSS splitting.

## Development Commands

**Install dependencies:**
```bash
npm install
```

**Development server:**
```bash
npm run dev
# Server runs on http://localhost:5173
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Lint code:**
```bash
npm run lint
```

## Architecture

### Tech Stack
- **React 19.2.6**: Latest React with modern features
- **React Router DOM 7.16.0**: Client-side routing with lazy loading
- **Tailwind CSS 3.4.0**: Utility-first CSS framework (stable version)
- **Vite 8.0.12**: Modern build tool with HMR and code splitting

### Project Structure
```
src/
├── app-constants.jsx    # ALL static text and UI copy
├── components/          # Reusable UI components
│   ├── Header.jsx      # Navigation header with routing
│   ├── Footer.jsx      # Footer component
│   └── LoadingSpinner.jsx # Loading states
├── pages/              # Route-level components (code split)
│   ├── Home.jsx        # Landing page with stats
│   ├── Teams.jsx       # Teams leaderboard with filtering
│   ├── Players.jsx     # Players ranking
│   └── Community.jsx   # Community information
├── hooks/              # Custom React hooks
│   └── useData.js      # Data fetching and state management
└── utils/              # Utility functions

public/data/            # All application data (JSON files)
├── teams.json          # Team information and ratings
├── players.json        # Player statistics and affiliations
├── news.json           # News updates and announcements
├── events.json         # Upcoming tournaments and events
├── community.json      # Community links and resources
└── stats.json          # Application statistics and configuration
```

### Text Constants Architecture

**All static text is centralized in `src/app-constants.jsx`:**
- **NO hardcoded strings** in components except dynamic data
- **Single source of truth** for all UI copy, headings, labels
- **Easy internationalization** preparation
- **Consistent text management** across the application

**Constants Structure:**
```javascript
APP_CONSTANTS = {
  BRAND: { NAME, FULL_NAME, TAGLINE, SUBTITLE },
  NAV: { HOME, TEAMS_RANKING, PLAYERS_RANKING, INFORMATION, JOIN_DISCORD },
  HOME: { MAIN_HEADING, FEATURES, STATS, SECTIONS },
  TEAMS: { PAGE_TITLE, TABLE_HEADERS, EMPTY_STATE },
  PLAYERS: { PAGE_TITLE, TABLE_HEADERS, EMPTY_STATE },
  COMMUNITY: { PAGE_TITLE, SECTIONS },
  UI: { LOADING, ERROR_LOADING_DATA },
  FOOTER: { COPYRIGHT },
  ICONS: { FontAwesome class names }
}
```

### Code Splitting Strategy

**Automatic route-based splitting:**
- Each page component is lazy-loaded using React.lazy()
- Suspense boundaries with loading spinners
- Manual chunk configuration in vite.config.js

**Chunk organization:**
- `react-vendor`: React core libraries
- `router-vendor`: React Router DOM
- `vendor`: Other third-party libraries
- Route-based chunks for pages and components

### Data Management

**Data Architecture:**
- **NO hardcoded data** in components except labels and UI text
- All data loaded from JSON files in `public/data/`
- Single `useData` hook manages all data fetching
- Centralized loading states and error handling

**Data Sources (`useData` hook):**
1. `teams.json` - Team information with ratings and stats
2. `players.json` - Individual player data and affiliations
3. `news.json` - News updates and announcements
4. `events.json` - Upcoming tournaments and events
5. `community.json` - Discord servers, streamers, organizers, contributors
6. `stats.json` - Application statistics and available regions

**Data Flow:**
1. Single `useData` hook fetches all JSON files on app load
2. Data processed and sorted (teams/players by rating descending)
3. Reactive state shared across all components
4. Loading and error states handled centrally

### Routing

**React Router Setup:**
- BrowserRouter for clean URLs
- Lazy-loaded routes with Suspense
- Active route highlighting in navigation

**Routes:**
- `/` - Home page with stats, news, and events
- `/teams` - Teams leaderboard with regional filtering
- `/players` - Players ranking table
- `/community` - Community resources and information

### Component Patterns

**Data Loading Pattern:**
```jsx
const { teams, players, news, events, community, stats, isLoading, error } = useData();

if (isLoading) return <LoadingSpinner />;
if (error) return <div>Error: {error}</div>;
```

**No Hardcoded Data Rule:**
- Components only contain labels, headings, and UI text
- All dynamic content comes from JSON files
- Easy to modify data without touching code

## Data Structure

### Teams (`public/data/teams.json`)
```json
{
  "name": "string",
  "flag": "ISO country code",
  "countryName": "string", 
  "region": "WEU|EEU|MENA",
  "rating": "number",
  "wins": "number",
  "losses": "number",
  "winRate": "percentage string",
  "status": "active|inactive|other",
  "lastActive": "relative time string"
}
```

### Players (`public/data/players.json`)
```json
{
  "name": "string",
  "flag": "ISO country code",
  "role": "string",
  "team": "string", 
  "rating": "number"
}
```

### News (`public/data/news.json`)
```json
{
  "date": "string",
  "title": "string",
  "description": "string"
}
```

### Events (`public/data/events.json`)
```json
{
  "name": "string",
  "region": "string",
  "countdown": "string",
  "gameType": "string"
}
```

### Community (`public/data/community.json`)
```json
{
  "discords": ["string"],
  "streamers": ["string"],
  "organizers": ["string"],
  "contributors": ["string"]
}
```

### Stats (`public/data/stats.json`)
```json
{
  "eventsRecorded": "number",
  "regionsCovered": "number",
  "availableRegions": ["ALL", "WEU", "EEU", "MENA"]
}
```

## Styling System

- **Tailwind CSS v3**: Stable version with proven compatibility
- **FontAwesome**: Icons loaded via CDN
- **Custom classes**: RTR-prefixed classes in `src/index.css`
- **Dark theme**: Consistent esports aesthetic with indigo accents
- **Responsive**: Mobile-first design with responsive grids

## Build Optimizations

**Vite Configuration:**
- Manual chunk splitting for optimal loading
- CSS code splitting enabled
- ESBuild minification for production
- Dependency pre-bundling for development speed

## Development Notes

- **No Hardcoded Data**: All data must come from JSON files
- **Hot Module Replacement**: Enabled via Vite for fast development
- **Error Boundaries**: Graceful error handling throughout app
- **Performance**: useMemo for expensive filtering operations
- **External Dependencies**: FontAwesome (CDN), flagcdn.com (API)

## Important Rules

1. **Data Source**: Never hardcode data in components - always use JSON files
2. **Text Constants**: All static text must use `APP_CONSTANTS` from `app-constants.jsx`
3. **Single Data Hook**: Use `useData()` hook for all data access
4. **Loading States**: Always handle loading and error states
5. **Flag Codes**: Use valid ISO country codes for flagcdn.com API
6. **No Hardcoded Strings**: Components should not contain any text literals except for dynamic data