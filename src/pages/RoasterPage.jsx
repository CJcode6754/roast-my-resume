import { useState, useEffect } from 'react';
import { DocumentHeader } from '../components/DocumentHeader';
import { DropZone } from '../components/DropZone';
import { LoadingSection } from '../components/LoadingSection';
import { EvaluationResult } from '../components/EvaluationResult';
import { useGroqRoast } from '../hooks/useGroqRoast';
import { extractPdfText } from '../utils/extractPdfText';
import { getIntensity } from '../utils/intensityScore';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { roastLimiter, publishLimiter } from '../lib/rateLimiter';

const SYSTEM_PROMPTS = {
  taglish: `Ikaw si "Komisyoner Roast" — opisyal na evaluator ng Career Evaluation Bureau ng Pilipinas.
Nakatanggap ka ng resume at kailangan mong mag-sulat ng OFFICIAL PERFORMANCE EVALUATION REMARKS.
Gamitin ang Taglish (mix ng Tagalog at English). Maging pormal sa simula tapos paunti-unting 
naging dramatic at nakakatawa — parang opisyal na nagpapanggap na seryoso pero grabe ang natatawa 
sa loob. Gamitin ang mga emoji nang may restraint. Tawagan ang laggard na career choices, 
generic objectives, suspicious employment gaps, buzzword abuse, at useless skills.
Huwag maging racist, sexist, o talagang nasaktan — comedy at pagmamahal ang basehan.
Tapusin ng isang backhanded commendation na parang ibinibigay mo ng certificate.
Walang markdown, walang bullet points. Prose lang tulad ng opisyal na ulat. ~280 salita.`,
  
  english: `You are "Commissioner Roast" — a senior evaluator at the Official Career Assessment Bureau.
You have received a resume for formal review and must write OFFICIAL EVALUATOR'S REMARKS.
Start with formal bureaucratic language that gradually devolves into devastating comedy — 
like a government official struggling to maintain composure.
Use dry wit, irony, and understatement. Call out: generic objectives, useless skills, 
suspicious gaps, buzzword overuse, and questionable career decisions.
Do NOT be hateful, racist, or genuinely cruel — keep it comedy.
End with a backhanded commendation in the tone of an official citation.
No markdown, no bullet points — flowing official prose. ~280 words.`
};

export default function RoasterPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('taglish');
  const [uploadError, setUploadError] = useState('');
  const { roast, loading, error, generateRoast } = useGroqRoast();

  // App settings - initialize from Local Storage to prevent loading flash
  const [roasterEnabled, setRoasterEnabled] = useState(() => {
    const saved = localStorage.getItem('bureau_settings');
    return saved ? JSON.parse(saved).roaster_enabled : true;
  });
  const [maintenanceMsg, setMaintenanceMsg] = useState(() => {
    const saved = localStorage.getItem('bureau_settings');
    return saved ? JSON.parse(saved).maintenance_message : '';
  });
  const [settingsLoading, setSettingsLoading] = useState(() => {
    return !localStorage.getItem('bureau_settings');
  });

  // Hall of Shame publish
  const [showPublish, setShowPublish] = useState(false);
  const [publishName, setPublishName] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    // Safety timeout: force loading to finish if network hangs
    const timeout = setTimeout(() => {
      setSettingsLoading(false);
    }, 3000);

    const fetchSettings = async () => {
      if (!supabase) {
        console.warn('⚠️ Supabase not initialized');
        setSettingsLoading(false);
        clearTimeout(timeout);
        return;
      }

      try {
        // First, verify we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!session) {
          console.warn('⚠️ No active session - settings fetch may fail due to RLS');
        }

        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) {
          console.error('❌ Settings fetch error:', error);
          console.error('  Code:', error.code);
          console.error('  Status:', error.status);
          console.error('  Message:', error.message);
          console.error('  Full error:', JSON.stringify(error));
        } else if (data) {
          setRoasterEnabled(data.roaster_enabled);
          setMaintenanceMsg(data.maintenance_message);
          localStorage.setItem('bureau_settings', JSON.stringify(data));
        } else {
          console.warn('⚠️ Settings query returned null data');
        }
      } catch (err) {
        console.error('❌ Unexpected error in settings fetch:', err);
      } finally {
        setSettingsLoading(false);
        clearTimeout(timeout);
      }
    };

    fetchSettings();

    return () => clearTimeout(timeout);
  }, []);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setUploadError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setShowPublish(false);
    setPublishSuccess(false);

    if (!file) {
      setUploadError('Resume file is required.');
      return;
    }

    const limit = roastLimiter.check();
    if (!limit.allowed) {
      setUploadError(limit.message);
      return;
    }

    roastLimiter.record();

    let resumeText = '';

    if (file.type === 'application/pdf') {
      try {
        resumeText = await extractPdfText(file);
        if (!resumeText) throw new Error('No text found in PDF.');
      } catch (err) {
        setUploadError(err.message || 'Failed to process PDF file.');
        return;
      }
    } else if (file.type === 'text/plain') {
      try {
        const text = await file.text();
        resumeText = text.substring(0, 10000);
      } catch (err) {
        setUploadError('Failed to read text file.');
        return;
      }
    }

    generateRoast({
      resumeText,
      systemPrompt: SYSTEM_PROMPTS[language]
    });
  };

  const handleReset = () => {
    setFile(null);
    setLanguage('taglish');
    setUploadError('');
    setShowPublish(false);
    setPublishSuccess(false);
    setPublishError('');
  };

  const handlePublish = async () => {
    const limit = publishLimiter.check();
    if (!limit.allowed) {
      setPublishError(limit.message);
      return;
    }

    setPublishing(true);
    setPublishError('');
    publishLimiter.record();

    const score = getIntensity(roast);
    const excerpt = roast.substring(0, 200) + (roast.length > 200 ? '...' : '');

    const { error: dbError } = await supabase.from('roast_results').insert({
      user_id: user.id,
      display_name: publishName.trim() || 'Anonymous Applicant',
      intensity_score: score,
      roast_excerpt: excerpt,
      is_public: true
    });

    if (dbError) {
      setPublishError(dbError.message);
    } else {
      setPublishSuccess(true);
      setShowPublish(false);
    }

    setPublishing(false);
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin mb-3">
            <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full"></div>
          </div>
          <p className="font-body text-ink-muted text-sm">Loading bureau services...</p>
        </div>
      </div>
    );
  }

  if (!roasterEnabled) {
    return (
      <div className="max-w-2xl mx-auto bg-paper p-8 shadow-lg my-8">
        <div className="border-2 border-ink-red p-6 text-center">
          <div className="text-4xl mb-3">🚫</div>
          <h2 className="text-xl font-display text-ink-red mb-2">SERVICE SUSPENDED</h2>
          <p className="font-body text-ink-muted text-sm">{maintenanceMsg}</p>
          <div className="mt-4 text-xs font-body text-ink-faint">
            OFFICIAL NOTICE — CAREER EVALUATION BUREAU
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-paper p-8 shadow-lg my-8"
      style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #c8b88a 39px, #c8b88a 40px)' }}>
      <DocumentHeader />

      <form onSubmit={handleSubmit} className="space-y-6">
        <DropZone onFileSelect={handleFileSelect} disabled={loading} error={uploadError} />

        <div>
          <label className="block text-xs font-body text-ink-muted mb-2 tracking-wider">SECTION II – EVALUATION PARAMETERS</label>
          <label className="block text-xs font-body text-ink-muted mb-3">LANGUAGE OF REPORT</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" value="taglish" checked={language === 'taglish'} onChange={(e) => setLanguage(e.target.value)} disabled={loading} className="w-4 h-4" />
              <span className="text-sm font-body text-ink">Taglish (Filipino + English)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="english" checked={language === 'english'} onChange={(e) => setLanguage(e.target.value)} disabled={loading} className="w-4 h-4" />
              <span className="text-sm font-body text-ink">English Only</span>
            </label>
          </div>
        </div>

        <div className="text-xs font-body text-ink-muted leading-relaxed p-3 border-l-2 border-rule">
          By submitting, you authorize the Bureau to conduct a thorough assessment of your professional shortcomings.
          No personal data is stored. Results are for entertainment purposes only. Bureau assumes no liability for wounded pride.
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading || !file}
            className="flex-1 px-4 py-3 font-display text-ink bg-rule hover:bg-rule/80 disabled:opacity-50 disabled:cursor-not-allowed transition border-2 border-ink">
            {loading ? 'Evaluating...' : 'Submit for Evaluation'}
          </button>
          <button type="button" onClick={handleReset} disabled={loading}
            className="px-4 py-3 font-body text-sm text-ink border border-rule hover:bg-paper/50 disabled:opacity-50 transition">
            New Submission
          </button>
        </div>
      </form>

      {loading && <LoadingSection />}

      {error && !loading && (
        <div className="mt-6 p-3 bg-ink-red/10 border border-ink-red text-ink-red text-sm font-body">
          {error}
        </div>
      )}

      {roast && !loading && <EvaluationResult roast={roast} />}

      {/* Publish to Hall of Shame */}
      {roast && !loading && !publishSuccess && (
        <div className="mt-6 border-2 border-dashed border-rule p-4">
          <label className="block text-xs font-body text-ink-muted mb-3 tracking-wider">
            SECTION III – PUBLIC RECORDS SUBMISSION
          </label>
          {!showPublish ? (
            <button onClick={() => setShowPublish(true)}
              className="w-full px-4 py-3 font-display text-ink bg-paper hover:bg-rule/30 transition border border-rule text-sm">
              📋 Submit to Hall of Shame
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1">DISPLAY NAME (optional)</label>
                <input type="text" value={publishName} onChange={(e) => setPublishName(e.target.value)}
                  placeholder="Anonymous Applicant"
                  className="w-full px-3 py-2 border-2 border-rule bg-paper font-body text-sm text-ink focus:border-ink focus:outline-none transition" />
              </div>
              <div className="text-xs text-ink-muted p-2 border-l-2 border-ink-red">
                ⚠ Your roast excerpt and Career Concern Index will be visible to all registered users. This action cannot be undone.
              </div>
              {publishError && (
                <div className="p-2 bg-ink-red/10 border border-ink-red text-ink-red text-xs font-body">
                  {publishError}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handlePublish} disabled={publishing}
                  className="flex-1 px-4 py-2 font-display text-ink bg-rule hover:bg-rule/80 disabled:opacity-50 transition border border-ink text-sm">
                  {publishing ? 'Publishing...' : 'Confirm Publication'}
                </button>
                <button onClick={() => setShowPublish(false)}
                  className="px-4 py-2 font-body text-xs text-ink border border-rule hover:bg-paper/50 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {publishSuccess && (
        <div className="mt-6 p-4 border-2 border-ink bg-rule/20 text-center">
          <div className="text-2xl mb-1">🏆</div>
          <p className="font-display text-ink text-sm">Successfully entered into the Hall of Shame!</p>
          <p className="text-xs text-ink-muted font-body mt-1">Your career deficiency is now a matter of public record.</p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t-2 border-double border-ink text-center">
        <div className="text-xs font-body text-ink-muted tracking-wider">RESUME ROASTER – OFFICIAL EVALUATION BUREAU</div>
        <div className="text-xs font-body text-ink-muted">llama 3.3 70b • Groq Free Tier</div>
        <div className="text-xs font-body text-ink-faint mt-1">🔒 Rate limited • 10 evaluations per hour</div>
      </div>
    </div>
  );
}
