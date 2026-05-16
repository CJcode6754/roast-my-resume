import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <span className="font-display text-ink text-sm tracking-wider hidden sm:inline">
            CAREER EVALUATION BUREAU
          </span>
        </div>

        <div className="flex items-center gap-2">
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

          <div className="ml-3 pl-3 border-l border-rule flex items-center gap-2">
            <span className="text-xs font-body text-ink-muted hidden md:inline">
              {profile?.display_name || user.email}
            </span>
            <button
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="px-3 py-1 text-xs font-display text-ink-red border border-ink-red hover:bg-ink-red/10 transition tracking-wider"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
