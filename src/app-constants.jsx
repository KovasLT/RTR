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
    NAME: 'COREner.eu', // Short brand name displayed in header logo
    FULL_NAME: 'Corener', // Full application name
    TAGLINE: 'Community Hub for MOBA', // Subtitle under brand name
    SUBTITLE: 'Connecting community teams, players, and tournaments across competitive MOBA.', // Main hero description
  },

  // ========================================
  // NAVIGATION
  // ========================================
  /** Navigation menu labels and buttons */
  NAV: {
    HOME: 'Home', // Dashboard/landing page link
    NEWS: 'News', // Community news / blog link
    DIRECTORY: 'Directory', // Talent directory link
    TEAMS_RANKING: 'Teams Ranking', // Teams leaderboard page link
    PLAYERS_RANKING: 'Players Ranking', // Players ranking page link
    INFORMATION: 'Information', // Community information page link
    JOIN_DISCORD: 'Join Discord', // Discord CTA button
    LOGIN: 'Login', // Login page link
    REGISTER: 'Register', // Register page link
    LOGOUT: 'Logout', // Logout button
    PROFILE: 'Profile', // User profile link
    EDIT_PROFILE: 'Edit profile', // Edit profile link in user menu
    DASHBOARD: 'Dashboard', // Role dashboard link
    ADMIN: 'Admin', // Admin dashboard link (admins only)
    MENU: 'Menu', // Mobile menu toggle label

// --- NEW ADDITIONS FOR DASHBOARD SIDEBAR ---
    QUICK_ACTIONS_TITLE: 'Match Actions',
    REPORT_MATCH: 'Report Match',
    LOOK_FOR_SCRIMS: 'Look for Scrims',
  },

  // ========================================
  // AUTHENTICATION
  // ========================================
  /** Authentication page text and labels */
  AUTH: {
    // Login Page (Discord is the only sign-in method)
    LOGIN_TITLE: 'Welcome to Corener',
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

  /** FontAwesome 6 icon class for each role. */
  ROLE_ICONS: {
    player: 'fa-gamepad',
    coach: 'fa-chalkboard-user',
    scout: 'fa-binoculars',
    tournament_manager: 'fa-trophy',
    team_manager: 'fa-users-gear',
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
    AVAILABILITY_LABEL: 'Availability',
    AVAILABILITY_PLACEHOLDER: 'e.g. Evenings CET, weekends',
    HERO_POOL_LABEL: 'Hero pool',
    HERO_POOL_HINT: 'Tap the heroes you play.',
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
    OVERVIEW: 'Overview',
    VIEW_AS: 'View as',
    VIEWING_AS_ADMIN: 'Previewing as admin',
    EDIT_PROFILE: 'Edit profile',
    COMING_SOON: 'Coming soon',
    RATING: 'Rating',
    // Per-role panel copy
    PLAYER_TITLE: 'Player',
    PLAYER_OVERVIEW: 'Overview',
    PLAYER_LFT_ON: 'You are visible to scouts as looking for a team.',
    PLAYER_LFT_OFF: 'You are not currently looking for a team.',
    PLAYER_TEAMS_TITLE: 'My teams',
    PLAYER_TEAMS_EMPTY: 'You are not on a team yet.',
    PLAYER_FIND_TEAM: 'Find a team',
    PLAYER_VIEW_TEAM: 'View',
    PLAYER_CAPTAIN: 'Captain',
    PLAYER_HERO_POOL: 'Hero pool',
    PLAYER_LFT_SET: 'Mark me as looking',
    PLAYER_LFT_UNSET: 'Stop looking',
    PLAYER_RATING_HISTORY: 'Rating history',
    PLAYER_RATING_HISTORY_EMPTY: 'Not enough rating history to chart yet.',
    PLAYER_WATCHERS_TITLE: 'Scouts watching me',
    PLAYER_WATCHERS_EMPTY: 'No scouts are watching you yet.',
    PLAYER_PEAK: 'Peak',
    PLAYER_CURRENT: 'Current',
    PLAYER_RECOMMENDED_TITLE: 'Recommended teams',
    PLAYER_RECOMMENDED_EMPTY: 'No recruiting teams match right now.',
    PLAYER_APPLY: 'Apply',
    PLAYER_ACTIVITY_TITLE: 'Recent activity',
    PLAYER_ACTIVITY_EMPTY: 'No activity yet.',
    PLAYER_AVAILABILITY: 'Availability',
    // Coach dashboard
    COACH_TEAMS_TITLE: 'Teams I coach',
    COACH_TEAMS_EMPTY: 'You are not attached to any team yet.',
    COACH_SPECIALTIES: 'Specialties',
    COACH_EXPERIENCE: 'Experience',
    COACH_YEARS: 'yrs',
    COACH_AVAILABILITY: 'Availability',
    COACH_ENDORSEMENTS: 'Endorsements',
    // Activity ledger reason labels
    RATING_REASONS: {
      initial: 'Joined',
      match_result: 'Match result',
      endorsement: 'Endorsement',
      achievement: 'Achievement',
      admin_adjustment: 'Adjustment',
    },
    PLAYER_APPLICATIONS: 'Team applications',
    PLAYER_APPLICATIONS_SOON: 'Apply to teams and track responses here (Phase 2).',
    COACH_TITLE: 'Coach',
    COACH_BODY: 'Manage coaching availability and connect with teams/players.',
    COACH_SOON: 'Coaching requests and rosters arrive in Phase 2.',
    SCOUT_TITLE: 'Scout',
    SCOUT_BODY: 'Track players you are watching and express interest.',
    SCOUT_SOON: 'Watchlists and scout-interest tools arrive in Phase 2.',
    SCOUT_WATCHLIST_TITLE: 'My watchlist',
    SCOUT_WATCHLIST_EMPTY: 'Your watchlist is empty. Add players below or from their profile.',
    SCOUT_ADD_TITLE: 'Add a player',
    SCOUT_SEARCH: 'Search players by name…',
    SCOUT_WATCH: 'Watch',
    SCOUT_REMOVE: 'Remove',
    TEAM_MANAGER_TITLE: 'Team Manager',
    TEAM_MANAGER_BODY: 'Create and manage your team and roster.',
    TEAM_MANAGER_SOON: 'Team creation, rosters and applications arrive in Phase 2.',
    TEAM_MANAGER_EMPTY: 'You have not created a team yet.',
    TEAM_MANAGER_CREATE: 'Create team',
    TEAM_MANAGE: 'Manage',
    TEAM_MEMBERS_COUNT: 'members',
    TEAM_PENDING_APPS: 'pending',
    // Player — applications & invites
    PLAYER_APPS_TITLE: 'Applications & invites',
    PLAYER_APPS_EMPTY: 'No applications or invites yet.',
    APP_ACCEPT: 'Accept',
    APP_WITHDRAW: 'Withdraw',
    APP_DECLINE: 'Decline',
    APP_SENT: 'Applied',
    APP_INVITE: 'Invited',
    TOURNAMENT_MANAGER_TITLE: 'Tournament Manager',
    TOURNAMENT_MANAGER_BODY: 'Host tournaments, register teams and run brackets.',
    TOURNAMENT_MANAGER_SOON: 'Tournament hosting and brackets arrive in Phase 3.',
  },

  // ========================================
  // TEAM MANAGEMENT (manage page + recruitment)
  // ========================================
  TEAM_MGMT: {
    CREATE_TITLE: 'Create a team',
    MANAGE_TITLE: 'Manage team',
    NOT_MANAGER: 'Only the team manager can edit this team.',
    NAME_LABEL: 'Team name',
    TAG_LABEL: 'Tag',
    LOGO_LABEL: 'Logo URL',
    REGION_LABEL: 'Region',
    STATUS_LABEL: 'Status',
    RECRUITMENT_LABEL: 'Recruitment note',
    RECRUITMENT_PLACEHOLDER: 'What roles/players are you looking for?',
    STATUS_RECRUITING: 'Recruiting',
    STATUS_ACTIVE: 'Active',
    STATUS_INACTIVE: 'Inactive',
    SAVE: 'Save changes',
    SAVING: 'Saving…',
    CREATE: 'Create team',
    CREATING: 'Creating…',
    SELECT_PLACEHOLDER: 'Select…',
    // Roster
    ROSTER_TITLE: 'Roster',
    ROSTER_EMPTY: 'No members yet. Invite players below.',
    CAPTAIN: 'Captain',
    MAKE_CAPTAIN: 'Make captain',
    REMOVE_MEMBER: 'Remove',
    // Staff
    STAFF_TITLE: 'Staff',
    STAFF_EMPTY: 'No staff assigned yet.',
    STAFF_ADD_TITLE: 'Add staff',
    STAFF_SEARCH: 'Search people by name…',
    STAFF_ADD: 'Add',
    STAFF_REMOVE: 'Remove',
    STAFF_ROLES: { coach: 'Coach', scout: 'Scout', analyst: 'Analyst' },
    STAFF_ROLE_ICONS: { coach: 'fa-chalkboard-user', scout: 'fa-binoculars', analyst: 'fa-magnifying-glass-chart' },
    // Applications inbox
    INBOX_TITLE: 'Applications',
    INBOX_EMPTY: 'No pending applications.',
    INBOX_ACCEPT: 'Accept',
    INBOX_REJECT: 'Reject',
    // Invite
    INVITE_TITLE: 'Invite a player',
    INVITE_SEARCH: 'Search players by name…',
    INVITE_SEND: 'Invite',
    INVITE_SENT: 'Invited',
    BACK_TO_DASHBOARD: 'Back to dashboard',
    ERROR: 'Something went wrong.',
    // Public view
    RATING: 'Rating',
    MANAGED_BY: 'Managed by',
    APPLY: 'Apply to team',
    APPLYING: 'Applying…',
    APPLIED: 'Application sent',
    ON_ROSTER: 'You’re on this roster',
    RECRUITMENT_HEADING: 'Recruitment',
  },

  // ========================================
  // ADMIN DASHBOARD
  // ========================================
  ADMIN: {
    TITLE: 'Admin Dashboard',
    SUBTITLE: 'Manage the Corener platform.',
    NOT_AUTHORIZED: 'You do not have access to this area.',
    TAB_OVERVIEW: 'Overview',
    TAB_USERS: 'Users & Roles',
    TAB_RATINGS: 'Ratings',
    TAB_REFERENCE: 'Reference Data',
    // Overview
    STAT_USERS: 'Users',
    STAT_PLAYERS: 'Players',
    STAT_ADMINS: 'Admins',
    STAT_SUPERUSERS: 'Super users',
    STAT_RATINGS: 'Ratings tracked',
    // Users
    USERS_SEARCH: 'Search users…',
    COL_USER: 'User',
    COL_ROLES: 'Roles',
    COL_ADMIN: 'Admin',
    MAKE_ADMIN: 'Make admin',
    REVOKE_ADMIN: 'Revoke admin',
    SUPERUSER_BADGE: 'Super user',
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
    REF_ADD_CONFIRM: 'Add this entry?',
    REF_DELETE_CONFIRM: 'Delete this entry? This cannot be undone.',
    REF_DELETE_FAILED: 'Could not delete — it may be in use, or you may not have permission.',
    SAVING: 'Saving…',
    ERROR: 'Something went wrong.',
  },

  // ========================================
  // NEWS / BLOG
  // ========================================
  NEWS: {
    TITLE: 'Community News',
    SUBTITLE: 'Updates and announcements from the community.',
    SUBMIT: 'Submit news',
    FORM_TITLE: 'Title',
    FORM_BODY: 'Body',
    FORM_IMAGE: 'Image URL (optional)',
    FORM_SUBMIT: 'Submit for review',
    FORM_SUBMITTING: 'Submitting…',
    SUBMITTED_NOTE: 'Submitted! An admin will review it before it goes live.',
    CANCEL: 'Cancel',
    PENDING_TITLE: 'Pending review',
    PENDING_EMPTY: 'Nothing waiting for review.',
    APPROVE: 'Approve',
    REJECT: 'Reject',
    MINE_TITLE: 'Your submissions',
    MINE_EMPTY: 'You have not submitted any news yet.',
    DELETE: 'Delete',
    FEED_TITLE: 'Latest news',
    FEED_EMPTY: 'No news yet — check back soon.',
    VIEW_ALL: 'View all news',
    BY: 'by',
    STATUS: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
    ERROR: 'Something went wrong.',
  },

  // ========================================
  // CONFIRM DIALOG
  // ========================================
  CONFIRM: {
    TITLE: 'Please confirm',
    CONFIRM: 'Confirm',
    CANCEL: 'Cancel',
    WORKING: 'Working…',
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
    AVAILABILITY: 'Availability',
    HERO_POOL: 'Hero pool',
    WATCH: 'Watch player',
    WATCHING: 'Watching',
    ENDORSE: 'Endorse',
    ENDORSED: 'Endorsed',
    ENDORSEMENTS: 'endorsements',
  },

  // ========================================
  // HOME PAGE CONTENT
  // ========================================
  /** Home/dashboard page text and labels */
  HOME: {
    MAIN_HEADING: 'Corener', // Main hero heading (first part)
    MAIN_HEADING_ACCENT: '.eu', // Main hero heading accent (colored part)

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
  // WELCOME PAGE (LOGGED OUT STATE)
  // ========================================
  WELCOME: {
    HEADING: 'Welcome to',
    SUBTITLE: 'The central community hub for MOBA community teams competitive rankings, team building, and community tournaments.',
    CALL_TO_ACTION: 'Sign in with Discord to view live statistics, track your Elo rating, and manage your rosters.',
    COMMUNITIES_TITLE: 'Join our Communities',
    COMMUNITIES_TEXT: 'Corener is a community project, currently not affiliated or endorsed by any game. We seek to help competitive players achieve their dreams. For more information join our discord servers or check INFORMATION panel:',
    LINKS: {
      ETIC: {
        NAME: 'ETIC League',
        URL: 'https://discord.gg/99txnCn8aZ',
        DESC: 'Discord for EU and MENA community teams to find scrims, scrims style tournaments, get information about official events and more'
      },
      THG: {
        NAME: 'THG',
        URL: 'https://discord.gg/9ydNJPKf5r',
        DESC: 'Discord for various format community tournaments and fun events'
      }
    }
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
      TEAM: 'Team', // Team name
      TAG: 'Tag', // Short team tag
      REGION: 'Region', // Region badge
      RATING: 'Rating', // Numeric Elo value
      MEMBERS: 'Roster', // Roster size
      STATUS: 'Status', // recruiting/active/inactive
    },

    /** Team status labels */
    STATUS: {
      recruiting: 'Recruiting',
      active: 'Active',
      inactive: 'Inactive',
    },

    EMPTY_STATE: 'No teams found for the selected region.', // Message when filter shows no results
    ALL_REGIONS: 'ALL',
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

  // Fallback shown by the top-level ErrorBoundary when the app crashes,
  // instead of a blank screen.
  ERROR_PAGE: {
    TITLE: 'Something went wrong',
    MESSAGE: 'An unexpected error occurred and this page could not be displayed. Head back home to continue.',
    HOME: 'Go home',
    DETAILS: 'Technical details',
  },

  // ========================================
  // FOOTER CONTENT
  // ========================================
  /** Footer text and legal information */
  FOOTER: {
    COPYRIGHT: '© 2026 Corener.eu. Community Hub for MOBA.', // Copyright notice
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