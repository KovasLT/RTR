import { APP_CONSTANTS } from '../app-constants';

/**
 * Footer Component
 *
 * Simple footer with copyright information and legal notice.
 * Displays consistent branding and maintains visual hierarchy.
 *
 * @returns {JSX.Element} Footer with copyright text
 */
const Footer = () => {
  return (
    // ========================================
    // APPLICATION FOOTER
    // ========================================
    <footer className="border-t border-slate-800/80 bg-[#0f1423] py-6 text-center">
      {/* Copyright and Legal Information */}
      <p className="text-xs text-slate-500">{APP_CONSTANTS.FOOTER.COPYRIGHT}</p>
    </footer>
  );
};

export default Footer;