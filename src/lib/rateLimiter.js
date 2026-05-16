/**
 * Client-side rate limiter.
 * Tracks attempts in memory per browser session.
 * Not a replacement for server-side rate limiting (Supabase handles that),
 * but adds an extra layer of protection against abuse.
 */
class RateLimiter {
  constructor(maxAttempts, windowMs) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = [];
  }

  check() {
    const now = Date.now();
    this.attempts = this.attempts.filter((t) => now - t < this.windowMs);

    if (this.attempts.length >= this.maxAttempts) {
      const oldestInWindow = this.attempts[0];
      const retryAfterMs = this.windowMs - (now - oldestInWindow);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      const retryMinutes = Math.ceil(retryAfterSec / 60);
      return {
        allowed: false,
        retryAfterSec,
        message: `Rate limit exceeded. Try again in ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.`
      };
    }

    return { allowed: true, retryAfterSec: 0, message: '' };
  }

  record() {
    this.attempts.push(Date.now());
  }

  reset() {
    this.attempts = [];
  }
}

// 5 login attempts per 15 minutes
export const loginLimiter = new RateLimiter(5, 15 * 60 * 1000);

// 3 signups per 30 minutes
export const signupLimiter = new RateLimiter(3, 30 * 60 * 1000);

// 10 roast generations per hour
export const roastLimiter = new RateLimiter(10, 60 * 60 * 1000);

// 5 Hall of Shame publishes per hour
export const publishLimiter = new RateLimiter(5, 60 * 60 * 1000);
