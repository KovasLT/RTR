/**
 * RTR Application Text Constants
 *
 * This file contains all static text, headings, labels, and UI copy used throughout
 * the RTR application. Centralizing text here provides:
 * - Single source of truth for all UI copy
 * - Easy content management without touching components
 * - Internationalization preparation
 * - Consistent terminology across the application
 *
 * @constant {Object} APP_CONSTANTS - Main constants object containing all static text
 */

export const APP_CONSTANTS = {
  // ========================================
  // BRAND & IDENTITY
  // ========================================
  /** Brand identity and core messaging */
  BRAND: {
    NAME: 'RTR', // Short brand name displayed in header logo
    FULL_NAME: 'Rising Teams Rating', // Full application name
    TAGLINE: 'Community Esports Rankings', // Subtitle under brand name
    SUBTITLE: 'Tracking community teams and players across competitive esports.', // Main hero description
  },

  // ========================================
  // NAVIGATION
  // ========================================
  /** Navigation menu labels and buttons */
  NAV: {
    HOME: 'Home', // Dashboard/landing page link
    TEAMS_RANKING: 'Teams Ranking', // Teams leaderboard page link
    PLAYERS_RANKING: 'Players Ranking', // Players ranking page link
    INFORMATION: 'Information', // Community information page link
    JOIN_DISCORD: 'Join Discord', // Discord CTA button
    LOGIN: 'Login', // Login page link
    REGISTER: 'Register', // Register page link
    LOGOUT: 'Logout', // Logout button
    PROFILE: 'Profile', // User profile link
  },

  // ========================================
  // AUTHENTICATION
  // ========================================
  /** Authentication page text and labels */
  AUTH: {
    // Login Page (Discord is the only sign-in method)
    LOGIN_TITLE: 'Welcome to RTR',
    LOGIN_SUBTITLE: 'Sign in with Discord to continue',
    LOGIN_FOOTNOTE: 'We only use Discord to identify you. No password required.',

    // Discord OAuth
    DISCORD_LOGIN: 'Continue with Discord',
    CONNECTING_DISCORD: 'Connecting to Discord...',
    SIGN_IN: 'Sign In',

    // Callback / processing screen
    CALLBACK_TITLE: 'Connecting to Discord',
    CALLBACK_SUBTITLE: 'Processing your Discord authentication...',

    // Error messages keyed by the ?error= query param on /login
    ERRORS: {
      discord_denied: 'Discord access was denied. Please try again.',
      discord_invalid: 'No authorization code was received from Discord.',
      discord_failed: 'Discord authentication failed. Please try again.',
      default: 'Something went wrong during sign in. Please try again.',
    },

    // User Greeting
    WELCOME: 'Welcome,',
    LOGGED_IN_AS: 'Logged in as',
  },

  // ========================================
  // HOME PAGE CONTENT
  // ========================================
  /** Home/dashboard page text and labels */
  HOME: {
    MAIN_HEADING: 'Rising Teams', // Main hero heading (first part)
    MAIN_HEADING_ACCENT: 'Rating', // Main hero heading accent (colored part)

    /** Feature highlights displayed below hero */
    FEATURES: {
      TRANSPARENT: 'Transparent Rankings', // Feature bullet 1
      PUBLIC_DATA: 'Public Data', // Feature bullet 2
      COMMUNITY_INFO: 'Community Information', // Feature bullet 3
    },

    /** Statistics dashboard labels */
    STATS: {
      TEAMS_TRACKED: 'Teams Tracked', // Dynamic count of teams
      PLAYERS_TRACKED: 'Players Tracked', // Dynamic count of players
      EVENTS_RECORDED: 'Events Recorded', // Static count from stats.json
      REGIONS_COVERED: 'Regions Covered', // Static count from stats.json
    },

    /** Content section headings */
    SECTIONS: {
      UPDATES: 'Updates', // News/updates section title
      UPCOMING_TOURNAMENTS: 'Upcoming Tournaments', // Events section title
    },
  },

  // ========================================
  // TEAMS PAGE CONTENT
  // ========================================
  /** Teams leaderboard page text and labels */
  TEAMS: {
    PAGE_TITLE: 'Community Teams Leaderboard', // Main page heading

    /** Table column headers */
    TABLE_HEADERS: {
      RANK: 'Rank', // Position in leaderboard
      TEAM: 'Team', // Team name with flag
      REGION: 'Region', // WEU/EEU/MENA region badge
      RATING: 'Rating', // Numeric rating value
      RECORD: 'Record (W-L)', // Win-Loss record
      WIN_RATE: 'Win %', // Win percentage
      STATUS: 'Status', // Active/inactive with indicator
    },

    EMPTY_STATE: 'No teams found for the selected region.', // Message when filter shows no results
  },

  // ========================================
  // PLAYERS PAGE CONTENT
  // ========================================
  /** Players ranking page text and labels */
  PLAYERS: {
    PAGE_TITLE: 'Players Ranking', // Main page heading

    /** Table column headers */
    TABLE_HEADERS: {
      RANK: 'Rank', // Position in ranking
      PLAYER: 'Player', // Player name with flag
      ROLE: 'Role', // Player position/role
      CURRENT_TEAM: 'Current Team', // Team affiliation
      RATING: 'Rating', // Numeric rating value
    },

    EMPTY_STATE: 'No players found.', // Message when no players exist
  },

  // ========================================
  // COMMUNITY PAGE CONTENT
  // ========================================
  /** Community information page text and labels */
  COMMUNITY: {
    PAGE_TITLE: 'Useful Information', // Main page heading

    /** Section headings for community resources */
    SECTIONS: {
      DISCORD_SERVERS: 'Discord Servers', // Community Discord links
      COMMUNITY_EVENTS: 'Community Events', // Event organizers
      POPULAR_STREAMERS: 'Popular Streamers', // Streaming personalities
      TOP_CONTRIBUTORS: 'Top Contributors', // Key community members
    },
  },

  // ========================================
  // UI STATES & FEEDBACK
  // ========================================
  /** Loading states and error messages */
  UI: {
    LOADING: 'Loading...', // Generic loading message
    ERROR_LOADING_DATA: 'Error loading data:', // Error message prefix
  },

  // ========================================
  // FOOTER CONTENT
  // ========================================
  /** Footer text and legal information */
  FOOTER: {
    COPYRIGHT: '© 2026 Rising Teams Rating (RTR). Open-Source Ranking System.', // Copyright notice
  },

  // ========================================
  // ICON CLASSES
  // ========================================
  /** FontAwesome icon class names used throughout the app */
  ICONS: {
    DISCORD: 'fab fa-discord', // Discord brand icon
    NEWSPAPER: 'fa-regular fa-newspaper', // News/updates icon
    CALENDAR: 'fa-regular fa-calendar', // Events/calendar icon
    TWITCH: 'fab fa-twitch', // Twitch brand icon
    TROPHY: 'fa-solid fa-trophy', // Tournament/competition icon
    USER_GEAR: 'fa-solid fa-user-gear', // Contributors/admin icon
    ARROW_EXTERNAL: 'fa-solid fa-arrow-up-right-from-square', // External link icon
  },
};