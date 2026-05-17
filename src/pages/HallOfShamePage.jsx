import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import logo from '../assets/resume-roaster-logo.png';

function getRankTitle(score) {
  if (score >= 90) return { title: 'Career Criminal', emoji: '☠️' };
  if (score >= 80) return { title: 'Professional Disaster', emoji: '💀' };
  if (score >= 70) return { title: 'Severe Concern', emoji: '🚩' };
  if (score >= 60) return { title: 'Notable Deficiency', emoji: '😬' };
  if (score >= 50) return { title: 'Under Observation', emoji: '👀' };
  return { title: 'Minor Infraction', emoji: '📋' };
}

function getMedalStyle(rank) {
  if (rank === 1) return 'border-2 border-yellow-600 bg-yellow-50';
  if (rank === 2) return 'border-2 border-gray-400 bg-gray-50';
  if (rank === 3) return 'border-2 border-amber-700 bg-amber-50';
  return 'border border-rule';
}

function getMedalEmoji(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export default function HallOfShamePage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout: force loading to finish if network hangs
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const fetchResults = async () => {
      if (!supabase) {
        console.warn('⚠️ Supabase not initialized for Hall of Shame');
        setLoading(false);
        clearTimeout(timeout);
        return;
      }

      try {
        // Verify session before query (public data but RLS may still require auth)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!session) {
          console.warn('⚠️ No active session - public data fetch may fail due to RLS');
        }

        const { data, error } = await supabase
          .from('roast_results')
          .select('*')
          .eq('is_public', true)
          .order('intensity_score', { ascending: false })
          .limit(50);

        if (error) {
          console.error('❌ Failed to load hall of shame:', error);
          console.error('  Code:', error.code);
          console.error('  Status:', error.status);
          console.error('  Message:', error.message);
          console.error('  Full error:', JSON.stringify(error));
        } else if (data) {
          setResults(data);
        } else {
          console.warn('⚠️ Hall of Shame query returned null data');
        }
      } catch (err) {
        console.error('❌ Unexpected error loading hall of shame:', err);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    fetchResults();

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin mb-3">
            <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full"></div>
          </div>
          <p className="font-body text-ink-muted text-sm">Loading public records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-paper p-8 shadow-lg my-8">
      {/* Header */}
      <div className="border-b-2 border-double border-ink pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-ink rounded-full flex items-center justify-center overflow-hidden bg-paper flex-shrink-0">
            <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          </div>
          <div>
            <div className="text-xs font-body text-ink-muted tracking-wider">PUBLIC RECORDS DIVISION</div>
            <h1 className="text-2xl font-display text-ink">Hall of Shame</h1>
            <div className="text-xs font-body text-ink-muted">CAREER DEFICIENCY REGISTRY — TOP OFFENDERS</div>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-rule">
          <div className="text-4xl mb-3">📂</div>
          <p className="font-display text-ink mb-1">No Public Records Found</p>
          <p className="text-xs text-ink-muted font-body">
            Be the first to submit your career deficiency to the public registry.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result, index) => {
            const rank = index + 1;
            const { title, emoji } = getRankTitle(result.intensity_score);
            const medalStyle = getMedalStyle(rank);
            const medal = getMedalEmoji(rank);

            return (
              <div key={result.id} className={`p-4 transition hover:shadow-md ${medalStyle}`}>
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center font-display text-ink text-sm">
                    {medal}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-display text-ink text-sm truncate">
                        {result.display_name}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-body text-ink-muted">{emoji} {title}</span>
                        <span className="font-display text-ink-red text-lg font-bold">
                          {result.intensity_score}
                        </span>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="w-full h-2 bg-paper border border-rule overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-rule to-ink-red transition-all"
                        style={{ width: `${result.intensity_score}%` }}
                      ></div>
                    </div>

                    {/* Excerpt */}
                    {result.roast_excerpt && (
                      <p className="text-xs font-body text-ink-muted italic leading-relaxed line-clamp-2">
                        "{result.roast_excerpt}"
                      </p>
                    )}

                    <div className="text-xs text-ink-faint font-body mt-1">
                      Filed: {new Date(result.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 pt-4 border-t-2 border-double border-ink text-center">
        <div className="text-xs font-body text-ink-muted tracking-wider">
          PUBLIC RECORDS — CAREER EVALUATION BUREAU
        </div>
        <div className="text-xs font-body text-ink-faint">
          {results.length} record{results.length !== 1 ? 's' : ''} on file
        </div>
      </div>
    </div>
  );
}
