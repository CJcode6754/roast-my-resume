import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signupLimiter } from '../lib/rateLimiter';

export default function SignupPage() {
  const { user, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const limit = signupLimiter.check();
    if (!limit.allowed) {
      setError(limit.message);
      return;
    }

    setLoading(true);
    signupLimiter.record();

    const { error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-full bg-paper-bg p-4 sm:p-8 font-body flex items-center justify-center">
        <div className="w-full max-w-md bg-paper p-8 shadow-lg border-2 border-ink text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-2 border-ink rounded-full flex items-center justify-center text-2xl">
              ✉️
            </div>
          </div>
          <h2 className="text-xl font-display text-ink mb-2">Registration Submitted</h2>
          <p className="text-sm text-ink-muted font-body mb-4">
            A verification dispatch has been sent to your email address.
            Please confirm your identity to gain bureau access.
          </p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 font-display text-ink bg-rule hover:bg-rule/80 border-2 border-ink transition tracking-wider text-sm"
          >
            RETURN TO LOGIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-paper-bg p-4 sm:p-8 font-body flex items-center justify-center">
      <div className="w-full max-w-md bg-paper p-8 shadow-lg border-2 border-ink">
        <div className="border-b-2 border-double border-ink pb-4 mb-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 border-2 border-ink rounded-full flex items-center justify-center font-display text-sm">
              ⭐
            </div>
          </div>
          <div className="text-xs text-ink-muted tracking-wider">REPUBLIC OF PROFESSIONAL AFFAIRS</div>
          <h1 className="text-xl font-display text-ink mt-1">New Personnel Registration</h1>
          <div className="text-xs text-ink-muted">FORM REG-01 • IDENTITY ENROLLMENT</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-muted mb-1 tracking-wider">EMAIL ADDRESS</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border-2 border-rule bg-paper font-body text-sm text-ink focus:border-ink focus:outline-none transition"
              placeholder="agent@bureau.gov"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-muted mb-1 tracking-wider">PASSWORD (MIN. 6 CHARACTERS)</label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-rule bg-paper font-body text-sm text-ink focus:border-ink focus:outline-none transition pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition p-1"
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62M1 1l22 22M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink-muted mb-1 tracking-wider">CONFIRM PASSWORD</label>
            <div className="relative">
              <input
                id="signup-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-rule bg-paper font-body text-sm text-ink focus:border-ink focus:outline-none transition pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition p-1"
                tabIndex="-1"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L4.62 4.62M1 1l22 22M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-ink-red/10 border border-ink-red text-ink-red text-xs font-body">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 font-display text-ink bg-rule hover:bg-rule/80 disabled:opacity-50 disabled:cursor-not-allowed transition border-2 border-ink tracking-wider"
          >
            {loading ? 'PROCESSING...' : 'SUBMIT REGISTRATION'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-rule text-center">
          <p className="text-xs text-ink-muted font-body">
            Already registered?{' '}
            <Link to="/login" className="text-ink underline hover:text-ink-red transition">
              Access your account
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <div className="text-xs text-ink-faint font-body">
            🔒 Protected by rate limiting • 3 registrations per 30 min
          </div>
        </div>
      </div>
    </div>
  );
}
