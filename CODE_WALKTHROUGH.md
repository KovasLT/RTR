# RTR Code Walkthrough

A comprehensive guide to understanding the Rising Teams Rating (RTR) codebase architecture, patterns, and implementation.

## Table of Contents

- [Overview](#overview)
- [Application Architecture](#application-architecture)
- [Entry Points](#entry-points)
- [Component Structure](#component-structure)
- [Data Management](#data-management)
- [Routing System](#routing-system)
- [Styling Strategy](#styling-strategy)
- [Development Patterns](#development-patterns)
- [File Organization](#file-organization)
- [Code Flow Examples](#code-flow-examples)

## Overview

RTR is a React-based esports ranking application that displays teams and players across multiple regions (WEU, EEU, MENA). The application follows modern React patterns with:

- **Component-based architecture** with clear separation of concerns
- **Data-driven design** where all content comes from JSON files
- **Centralized text management** through constants
- **Performance optimization** through code splitting and lazy loading

## Application Architecture

```
┌─────────────────────────────────────────┐
│                 Browser                 │
├─────────────────────────────────────────┤
│              React Router               │
├─────────────────────────────────────────┤
│         Lazy-Loaded Pages              │
│  ┌─────────┬──────────┬──────────────┐  │
│  │  Home   │  Teams   │   Players    │  │
│  │         │          │              │  │
│  └─────────┴──────────┴──────────────┘  │
├─────────────────────────────────────────┤
│            Shared Components            │
│         (Header, Footer, etc.)          │
├─────────────────────────────────────────┤
│              useData Hook               │
│        (Centralized Data Fetching)     │
├─────────────────────────────────────────┤
│               JSON Data                 │
│   ┌─────────────────────────────────┐   │
│   │  teams.json    players.json     │   │
│   │  news.json     events.json      │   │
│   │  community.json stats.json      │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Entry Points

### 1. `index.html`
The root HTML file that:
- Sets up the basic page structure
- Includes FontAwesome for icons
- Defines the root mounting point for React

### 2. `src/main.jsx`
React application bootstrap:
```javascript
// Creates React root and renders the main App component
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### 3. `src/App.jsx`
Main application container:
- Sets up React Router with lazy-loaded routes
- Defines the overall layout structure (Header → Main → Footer)
- Handles Suspense boundaries for code-split pages

## Component Structure

### Layout Components

#### **Header (`src/components/Header.jsx`)**
**Purpose**: Main navigation and branding
**Key Features**:
- Brand logo and title display
- React Router navigation with active state highlighting
- Discord CTA button
- Responsive navigation (hidden on mobile)

**Navigation Logic**:
```javascript
const isActiveRoute = (path) => {
  // Special handling for home route (exact match)
  if (path === '/' && location.pathname === '/') return true;
  // Other routes use prefix matching
  return path !== '/' && location.pathname.startsWith(path);
};
```

#### **Footer (`src/components/Footer.jsx`)**
**Purpose**: Simple footer with copyright information
**Features**: Displays legal/copyright text from constants

#### **LoadingSpinner (`src/components/LoadingSpinner.jsx`)**
**Purpose**: Consistent loading state across the app
**Usage**: Used as Suspense fallback for lazy-loaded routes

### Page Components (Route-Level)

#### **Home (`src/pages/Home.jsx`)**
**Purpose**: Dashboard/landing page
**Structure**:
1. **Hero Section**: Brand messaging and feature highlights
2. **Statistics Dashboard**: Live counts (teams, players) + static stats
3. **Content Sections**: News updates and upcoming tournaments

**Data Dependencies**:
- `teams.length` - Live count of teams
- `players.length` - Live count of players  
- `stats.eventsRecorded` - Static count from stats.json
- `news` array - Dynamic content from news.json
- `events` array - Dynamic content from events.json

#### **Teams (`src/pages/Teams.jsx`)**
**Purpose**: Teams leaderboard with regional filtering
**Key Features**:
- Regional filter buttons (ALL, WEU, EEU, MENA)
- Sortable table by rating (descending)
- Team status indicators (active/inactive with visual cues)
- Country flags via flagcdn.com API

**Filtering Logic**:
```javascript
const filteredTeams = useMemo(() => {
  if (currentRegionFilter === 'ALL') return teams;
  return teams.filter(team => team.region === currentRegionFilter);
}, [teams, currentRegionFilter]);
```

#### **Players (`src/pages/Players.jsx`)**
**Purpose**: Individual player rankings
**Structure**: Simple table showing player rankings by rating
**Features**:
- Player names with country flags
- Team affiliations
- Player roles
- Rating-based sorting

#### **Community (`src/pages/Community.jsx`)**
**Purpose**: Community resources and information
**Content Sections**:
- Discord servers
- Event organizers  
- Popular streamers
- Top contributors

**Data Source**: All content loaded from `community.json`

## Data Management

### Central Data Hook (`src/hooks/useData.js`)

**Purpose**: Single source of truth for all application data

**What it fetches**:
```javascript
return { 
  teams,     // Array of team objects (sorted by rating)
  players,   // Array of player objects (sorted by rating)
  news,      // Array of news/update items
  events,    // Array of upcoming tournaments
  community, // Object with community resources
  stats,     // Object with app statistics
  isLoading, // Boolean loading state
  error      // String error message or null
};
```

**Fetching Strategy**:
1. **Parallel Loading**: All 6 JSON files fetched simultaneously
2. **Error Resilience**: Each fetch has fallback to empty data
3. **Data Processing**: Teams/players sorted by rating descending
4. **Structure Validation**: Handles both flat arrays and nested objects

### Data Flow Pattern

```
Component Mount
    ↓
useData() hook called
    ↓
Parallel fetch of all JSON files
    ↓
Data processed and sorted
    ↓
State updated with processed data
    ↓
Components re-render with data
    ↓
Loading state cleared
```

### Error Handling
- Network errors return empty fallback data
- Invalid JSON structure is handled gracefully
- Error messages displayed to user when critical failures occur

## Routing System

### Route Configuration (`src/App.jsx`)
```javascript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/teams" element={<Teams />} />
  <Route path="/players" element={<Players />} />
  <Route path="/community" element={<Community />} />
</Routes>
```

### Code Splitting Strategy
- Each page is lazy-loaded using `React.lazy()`
- Suspense boundaries prevent loading waterfalls
- LoadingSpinner shown during route transitions

### Navigation Flow
1. User clicks navigation link in Header
2. React Router updates URL and triggers route change
3. Lazy-loaded component begins loading (if not cached)
4. Suspense boundary shows LoadingSpinner
5. Component loads and renders with data from useData hook
6. Header navigation updates active state

## Styling Strategy

### Tailwind CSS Foundation
- **Utility-first** approach for rapid development
- **Responsive design** with mobile-first breakpoints
- **Dark theme** optimized for esports aesthetic
- **Custom color palette** with indigo accents

### Color System
```css
/* Primary Colors */
--bg-primary: #0b0f19     /* Main background */
--bg-secondary: #13192b   /* Card backgrounds */  
--bg-header: #0f1423      /* Header/footer */

/* Text Colors */
--text-primary: #cbd5e1   /* Main text (slate-300) */
--text-secondary: #94a3b8 /* Secondary text (slate-400) */
--text-white: #ffffff     /* Headings */

/* Accent Colors */
--accent-primary: #6366f1 /* Indigo-500 (brand) */
--accent-emerald: #10b981 /* Success/active */
--accent-amber: #f59e0b   /* Warning/stats */
--accent-red: #f43f5e     /* Error/inactive */
```

### Custom CSS Classes (`src/index.css`)
- **RTR-specific components** (`.rtr-card`, `.stat-card`)
- **Animation utilities** (`.animate-fade-in`)
- **Table styling** (`.rtr-table-row`)
- **Trend indicators** (`.trend-up`, `.trend-down`)

## Development Patterns

### Text Constants Pattern
**Problem**: Hardcoded strings scattered throughout components
**Solution**: Centralized constants in `app-constants.jsx`

```javascript
// Instead of:
<h1>Teams Ranking</h1>

// Use:
<h1>{APP_CONSTANTS.TEAMS.PAGE_TITLE}</h1>
```

**Benefits**:
- Single source of truth for all UI text
- Easy to update content without touching code
- Internationalization-ready
- Consistent terminology

### Data Loading Pattern
**Problem**: Components directly fetching their own data
**Solution**: Single `useData` hook with centralized loading

```javascript
// Every page follows this pattern:
const { teams, players, isLoading, error } = useData();

if (isLoading) return <LoadingSpinner />;
if (error) return <div>Error: {error}</div>;

// Render with data...
```

**Benefits**:
- Consistent loading states
- Shared data between components
- Single source of truth
- Centralized error handling

### Component Composition Pattern
**Structure**: Each component has clear, single responsibility
```
App (Router setup)
├── Header (Navigation)
├── Main Content (Route-specific)
│   └── Page Components (Data display)
└── Footer (Legal info)
```

## File Organization

### Source Structure (`src/`)
```
src/
├── app-constants.jsx    # All UI text and labels
├── main.jsx            # React bootstrap
├── App.jsx             # Router and layout
├── index.css           # Global styles and utilities
│
├── components/         # Reusable UI components
│   ├── Header.jsx      # Navigation and branding
│   ├── Footer.jsx      # Footer with legal info
│   └── LoadingSpinner.jsx # Loading state indicator
│
├── pages/              # Route-level components (lazy loaded)
│   ├── Home.jsx        # Dashboard with stats and content
│   ├── Teams.jsx       # Teams leaderboard with filtering
│   ├── Players.jsx     # Player rankings table
│   └── Community.jsx   # Community resources
│
├── hooks/              # Custom React hooks
│   └── useData.js      # Centralized data fetching
│
└── utils/              # Helper functions (future use)
```

### Data Structure (`public/data/`)
```
public/data/
├── teams.json         # Team info, ratings, records
├── players.json       # Player stats and affiliations  
├── news.json          # Updates and announcements
├── events.json        # Upcoming tournaments
├── community.json     # Discord, streamers, organizers
└── stats.json         # App config and static stats
```

## Code Flow Examples

### 1. User Views Teams Page
```
1. User clicks "Teams Ranking" in Header
2. React Router navigates to /teams
3. Teams component lazy-loads (with Suspense fallback)
4. Teams component calls useData() hook
5. useData returns cached data (or loads if first visit)
6. Teams component renders with filtered team data
7. Header updates active navigation state
8. User can filter by region using filter buttons
9. useMemo recalculates filtered results
10. Table re-renders with filtered teams
```

### 2. Data Loading on App Start
```
1. App component mounts
2. Any page component calls useData() hook
3. useData starts parallel fetch of all 6 JSON files:
   - teams.json, players.json, news.json
   - events.json, community.json, stats.json
4. Each file loads independently with error fallbacks
5. Data processed: teams/players sorted by rating
6. All components with useData() re-render with data
7. Loading states clear, full app becomes interactive
```

### 3. Regional Filtering (Teams Page)
```
1. Teams page loads with all teams displayed
2. User clicks "EEU" region filter button  
3. setCurrentRegionFilter('EEU') called
4. useMemo dependency changes, triggers recalculation
5. filteredTeams = teams.filter(team => team.region === 'EEU')
6. Table component re-renders with only EEU teams
7. Filter button UI updates to show active state
8. Empty state message shows if no teams in region
```

### 4. Adding New Content
```
To add a news item:
1. Edit public/data/news.json
2. Add new object: {date, title, description}
3. Refresh browser - useData fetches updated file
4. Home page automatically displays new news item
5. No code changes required
```

## Understanding the Codebase

### For New Developers
1. **Start with `App.jsx`** - Understand the routing structure
2. **Read `useData.js`** - This is the data backbone
3. **Check `app-constants.jsx`** - All UI text is here
4. **Explore page components** - Each represents a major feature
5. **Look at data files** - Understand the content structure

### For Content Updates
- **Text changes**: Edit `app-constants.jsx`
- **Data updates**: Modify JSON files in `public/data/`
- **Styling**: Update Tailwind classes or `index.css`

### For Feature Development
- **New pages**: Add lazy-loaded component + route
- **New data**: Add to `useData` hook + JSON file
- **New text**: Add to `app-constants.jsx`
- **Shared logic**: Create custom hooks in `hooks/`

## Key Principles

1. **Data-Driven**: All content comes from external files
2. **Component Composition**: Small, focused components
3. **Performance First**: Code splitting and optimized loading
4. **Maintainable**: Clear patterns and comprehensive docs
5. **Type Safety**: JSDoc comments provide type information
6. **Consistency**: Shared patterns across all components

This walkthrough provides the foundation for understanding and contributing to the RTR codebase. Each component, hook, and pattern follows these established conventions for maximum maintainability and clarity.