import { Component } from 'react';
import { APP_CONSTANTS } from '../app-constants';

const E = APP_CONSTANTS.ERROR_PAGE;

/**
 * Top-level error boundary.
 *
 * Catches render/runtime errors anywhere below it and shows a friendly
 * fallback page instead of a blank screen. Error boundaries must be class
 * components — there is no hook equivalent.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surface it in the console for debugging; swap for real logging later.
    console.error('Uncaught error caught by ErrorBoundary:', error, info);
  }

  handleHome = () => {
    // Hard navigation guarantees a clean remount even if routing is what broke.
    // Home ('/') is public, so this always lands on a usable page.
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-300 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center rtr-card">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <i className="fas fa-triangle-exclamation text-red-400 text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{E.TITLE}</h1>
          <p className="text-sm text-gray-400 mb-6">{E.MESSAGE}</p>

          <div className="flex items-center justify-center">
            <button onClick={this.handleHome} className="rtr-btn-primary">
              <i className="fas fa-house mr-2"></i>
              {E.HOME}
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left">
              <summary className="text-xs text-gray-500 cursor-pointer">{E.DETAILS}</summary>
              <pre className="mt-2 text-[11px] text-red-300 bg-black/40 border border-gray-800 rounded-lg p-3 overflow-auto whitespace-pre-wrap">
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
