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
    DIRECTORY: 'Directory', // Talent directory link
    TEAMS_RANKING: 'Teams Ranking', // Teams leaderboard page link
    PLAYERS_RANKING: 'Players Ranking', // Players ranking page link
    INFORMATION: 'Information', // Community information page link
    JOIN_DISCORD: 'Join Discord', // Discord CTA button
    LOGIN: 'Login', // Login page link
    REGISTER: 'Register', // Register page link
    LOGOUT: 'Logout', // Logout button
    PROFILE: 'Profile', // User profile link
    DASHBOARD: 'Dashboard', // Role dashboard link
    ADMIN: 'Admin', // Admin dashboard link (admins only)
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
  // ROLES (Honor of Kings platform)
  // ========================================
  /** Human labels for the role enum values */
  ROLES: {
    player: 'Player',
    coach: 'Coach',
    scout: 'Scout',
    tournament_manager: 'Tournament Manager',
    team_manager: 'Team Manager',
  },

  // ========================================
  // ONBOARDING / PROFILE EDIT
  // ========================================
  ONBOARDING: {
    TITLE: 'Set up your profile',
    SUBTITLE: 'Tell the community who you are and what you do.',
    EDIT_TITLE: 'Edit your profile',
    EDIT_SUBTITLE: 'Update your details and roles.',
    DISPLAY_NAME_LABEL: 'Display name',
    BIO_LABEL: 'Bio',
    BIO_PLACEHOLDER: 'A short intro — your experience, goals, what you’re looking for…',
    REGION_LABEL: 'Region',
    COUNTRY_LABEL: 'Country (ISO code, e.g. US, SA)',
    ROLES_LABEL: 'Your roles',
    ROLES_HINT: 'Pick everything that applies — you can hold more than one.',
    PLAYER_SECTION: 'Player details',
    LANE_LABEL: 'Main lane',
    RANK_LABEL: 'Rank',
    SERVER_LABEL: 'In-game name / server',
    LFT_LABEL: 'Looking for a team',
    COACH_SECTION: 'Coach details',
    SPECIALTIES_LABEL: 'Specialties',
    EXPERIENCE_LABEL: 'Years of experience',
    SCOUT_SECTION: 'Scout / Organisation details',
    ORG_LABEL: 'Organisation',
    SAVE: 'Save profile',
    SAVING: 'Saving…',
    SELECT_PLACEHOLDER: 'Select…',
  },

  // ========================================
  // DIRECTORY
  // ========================================
  DIRECTORY: {
    TITLE: 'Talent Directory',
    SUBTITLE: 'Discover players, coaches, scouts and managers.',
    SEARCH_PLACEHOLDER: 'Search by name…',
    FILTER_ROLE: 'Role',
    FILTER_LANE: 'Lane',
    FILTER_RANK: 'Rank',
    FILTER_REGION: 'Region',
    ALL: 'All',
    EMPTY: 'No one matches these filters yet.',
    LFT_BADGE: 'Looking for team',
  },

  // ========================================
  // ROLE DASHBOARDS
  // ========================================
  DASHBOARD: {
    TITLE: 'Dashboard',
    SUBTITLE: 'Your role tools and activity.',
    NO_ROLES_TITLE: 'No roles yet',
    NO_ROLES_BODY: 'Add a role to your profile to unlock its dashboard.',
    SET_UP_PROFILE: 'Set up profile',
    VIEW_AS: 'View as',
    VIEWING_AS_ADMIN: 'Previewing as admin',
    EDIT_PROFILE: 'Edit profile',
    COMING_SOON: 'Coming soon',
    RATING: 'Rating',
    // Per-role panel copy
    PLAYER_TITLE: 'Player',
    PLAYER_LFT_ON: 'You are visible to scouts as looking for a team.',
    PLAYER_LFT_OFF: 'You are not currently looking for a team.',
    PLAYER_APPLICATIONS: 'Team applications',
    PLAYER_APPLICATIONS_SOON: 'Apply to teams and track responses here (Phase 2).',
    COACH_TITLE: 'Coach',
    COACH_BODY: 'Manage coaching availability and connect with teams/players.',
    COACH_SOON: 'Coaching requests and rosters arrive in Phase 2.',
    SCOUT_TITLE: 'Scout',
    SCOUT_BODY: 'Track players you are watching and express interest.',
    SCOUT_SOON: 'Watchlists and scout-interest tools arrive in Phase 2.',
    TEAM_MANAGER_TITLE: 'Team Manager',
    TEAM_MANAGER_BODY: 'Create and manage your team and roster.',
    TEAM_MANAGER_SOON: 'Team creation, rosters and applications arrive in Phase 2.',
    TOURNAMENT_MANAGER_TITLE: 'Tournament Manager',
    TOURNAMENT_MANAGER_BODY: 'Host tournaments, register teams and run brackets.',
    TOURNAMENT_MANAGER_SOON: 'Tournament hosting and brackets arrive in Phase 3.',
  },

  // ========================================
  // ADMIN DASHBOARD
  // ========================================
  ADMIN: {
    TITLE: 'Admin Dashboard',
    SUBTITLE: 'Manage the RTR platform.',
    NOT_AUTHORIZED: 'You do not have access to this area.',
    TAB_OVERVIEW: 'Overview',
    TAB_USERS: 'Users & Roles',
    TAB_RATINGS: 'Ratings',
    TAB_REFERENCE: 'Reference Data',
    // Overview
    STAT_USERS: 'Users',
    STAT_PLAYERS: 'Players',
    STAT_ADMINS: 'Admins',
    STAT_RATINGS: 'Ratings tracked',
    // Users
    USERS_SEARCH: 'Search users…',
    COL_USER: 'User',
    COL_ROLES: 'Roles',
    COL_ADMIN: 'Admin',
    MAKE_ADMIN: 'Make admin',
    REVOKE_ADMIN: 'Revoke admin',
    REMOVE_ROLE: 'Remove',
    // Ratings
    RATINGS_PICK_USER: 'Search a user…',
    RATINGS_SUBJECT: 'Subject (role)',
    RATINGS_DELTA: 'Adjustment (+/-)',
    RATINGS_NOTE: 'Reason / note',
    RATINGS_APPLY: 'Apply adjustment',
    RATINGS_LEDGER: 'Recent rating events',
    RATINGS_EMPTY_LEDGER: 'No rating events yet.',
    // Reference data
    REF_LANES: 'Lanes',
    REF_RANKS: 'Ranks',
    REF_REGIONS: 'Regions',
    REF_HEROES: 'Heroes',
    REF_ADD: 'Add',
    REF_NAME_PLACEHOLDER: 'Name',
    REF_CODE_PLACEHOLDER: 'Code',
    REF_DELETE: 'Delete',
    SAVING: 'Saving…',
    ERROR: 'Something went wrong.',
  },

  // ========================================
  // PROFILE VIEW
  // ========================================
  PROFILE_PAGE: {
    NOT_FOUND: 'Profile not found.',
    EDIT: 'Edit Profile',
    SIGN_OUT: 'Sign Out',
    RATINGS: 'Ratings',
    ROLES: 'Roles',
    NO_ROLES: 'No roles set yet.',
    DISCORD_NOTE: 'Account managed via Discord.',
    MEMBER_SINCE: 'Member since',
    LANE: 'Lane',
    RANK: 'Rank',
    SERVER: 'In-game name',
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