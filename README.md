# RTR - Rising Teams Rating

A modern React application for tracking esports community rankings across WEU, EEU, and MENA regions.

## Features

- **Teams Leaderboard** with regional filtering and live status indicators
- **Player Rankings** with team affiliations and performance metrics
- **Community Hub** with Discord servers, streamers, and event organizers
- **Real-time Statistics** dashboard with tracked metrics
- **Responsive Design** optimized for desktop and mobile
- **Code Splitting** for optimal performance
- **Dark Theme** with esports-focused aesthetic

## Tech Stack

- **React 19** with modern hooks and Suspense
- **React Router DOM 7** for client-side routing
- **Tailwind CSS 4** for utility-first styling
- **Vite 8** for fast development and optimized builds
- **FontAwesome** icons and **flagcdn.com** for country flags

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:5173
```

### Available Scripts

```bash
npm run dev      # Start development server with HMR
npm run build    # Build for production with optimizations  
npm run preview  # Preview production build locally
npm run lint     # Run ESLint on codebase
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route components (lazy loaded)
├── hooks/              # Custom React hooks
└── utils/              # Helper functions

public/
└── data/               # JSON data files for teams/players
```

## Data Management

Team and player data is stored in JSON files in the `public/data/` directory:

- `teams.json` - Team information with ratings, records, and regional data
- `players.json` - Individual player stats and team affiliations

Data is fetched client-side using the custom `useData` hook with automatic error handling and loading states.

## Development

The application uses modern React patterns:

- **Lazy Loading**: Pages are code-split using React.lazy()
- **Suspense Boundaries**: Loading states handled declaratively
- **Custom Hooks**: Centralized data fetching and state management
- **CSS Splitting**: Automatic style extraction and optimization

### Adding New Data

1. Edit JSON files in `public/data/`
2. Follow existing data structure
3. Use valid ISO country codes for flags
4. Restart dev server to see changes

## Build Optimizations

- **Automatic Code Splitting** by route and vendor libraries
- **CSS Code Splitting** for optimal loading performance  
- **Tree Shaking** removes unused code
- **Asset Optimization** compresses images and fonts
- **Bundle Analysis** via Vite's built-in tools

## License

MIT License - see LICENSE file for details