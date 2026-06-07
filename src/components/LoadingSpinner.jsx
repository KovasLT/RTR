import { APP_CONSTANTS } from '../app-constants';

/**
 * Loading Spinner Component
 *
 * Displays a centered loading indicator with text while data is being fetched.
 * Used as fallback content for Suspense boundaries and async operations.
 * Provides consistent loading experience across the application.
 *
 * @returns {JSX.Element} Animated loading spinner with text
 */
const LoadingSpinner = () => {
  return (
    // ========================================
    // LOADING STATE INDICATOR
    // ========================================
    <div className="flex items-center justify-center min-h-[400px]">
      {/* Animated Spinner */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>

      {/* Loading Text */}
      <span className="ml-3 text-slate-400">{APP_CONSTANTS.UI.LOADING}</span>
    </div>
  );
};

export default LoadingSpinner;