import { Link, useLocation, useNavigate } from 'react-router-dom';
import { memo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/resume-roaster-logo.png';

function NavbarComponent() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await signOut();
      // Use replace: true to prevent back navigation to protected route
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout navigation failed:', err);
      // Fallback redirect
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `px-3 py-1 text-xs font-display tracking-wider transition border ${
      isActive(path)
        ? 'bg-ink text-paper border-ink'
        : 'text-ink border-rule hover:bg-rule/40'
    }`;

  return (
    <nav className="bg-paper border-b-2 border-ink shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-2 md:gap-3">
          <img src={logo} alt="Resume Roaster Logo" className="w-10 h-10 md:w-8 md:h-8 object-contain" />
          <span className="font-display text-ink text-xs sm:text-sm tracking-wider text-center">
            CAREER EVALUATION BUREAU
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-1 md:mt-0">
          <Link to="/" className={linkClass('/')}>
            ROASTER
          </Link>
          <Link to="/hall-of-shame" className={linkClass('/hall-of-shame')}>
            HALL OF SHAME
          </Link>
          {isAdmin && (
            <Link to="/admin" className={linkClass('/admin')}>
              ADMIN
            </Link>
          )}

          <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-1 sm:pl-2 sm:border-l border-rule">
            <span className="text-xs font-body text-ink-muted hidden md:inline">
              {profile?.display_name || user.email}
            </span>
            <button
              onClick={handleLogout}
              type="button"
              disabled={isLoggingOut}
              className={`px-3 py-1 text-xs font-display text-ink-red border border-ink-red transition tracking-wider ${
                isLoggingOut ? 'opacity-50 cursor-wait' : 'hover:bg-ink-red/10 cursor-pointer'
              }`}
            >
              {isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export const Navbar = memo(NavbarComponent);
