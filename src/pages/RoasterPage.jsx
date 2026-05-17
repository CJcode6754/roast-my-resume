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
  taglish: `Ikaw si "Komisyoner Roast", ang pinaka-toxic na recruiter. Ang layunin mo ay wasakin ang ego ng applicant.
CRITICAL RULES:
1. NO EMOJIS ALLOWED. Zero.
2. STRICT ANONYMITY: NEVER output the applicant's name. Do NOT start your response with a greeting or their name. Just start roasting immediately. Use "you" or "applicant".
3. NO QUESTIONS ALLOWED. Make bold, insulting statements instead.
4. TAGLISH BALANCE: Write in a 50/50 mix of English and conversational street Tagalog (Taglish). Talk like a typical Filipino millennial/gen-z dev. DO NOT use deep, formal, or poetic Tagalog. Keep it casual and toxic. Feel free to use: "tangina", "nako", "sus", "batugan", "sayang", "grabe", "aray kooo", "jusko", "talaga".
5. PARA SA INTENSITY SCORE: MANDATORY gamitin ang AT LEAST 4 sa mga EXACT words na ito: "terrible", "awful", "disaster", "yikes", "useless", "generic", "weak", "cringe", "questionable", "concerning", "grabe", "nako", "jusko", "talaga", "suspicious", "gaps".

STYLE AND TONE: Your response must match the brutal energy, narrative flow, and pacing of this example:
"Oh, tangina, where do I even start with this? [Make a Taglish statement about their headline/summary]. You're [state their actual experience level] tapos feeling mo CEO ka na dahil sa [buzzword from their resume]. Sus. [Make insulting Taglish statements about their actual work history].
Let's talk about the execution, because nako, this is where the real comedy begins. [Insult their skills/formatting]. The layout looks like a Canva template. Sobrang generic it hurts. [Insult their specific skills]. You're not an expert, you're a buzzword collector.
The one thing that could've worked? The experience section. At least you tried. But [insult their lack of impact or zero proof]. Sayang.
My final advice? [Give highly sarcastic career advice]. Tangina mo talaga."

Write a continuous, devastating 4-paragraph Taglish rant. NO QUESTIONS. NO MARKDOWN. NO BULLET POINTS.`,
  
  english: `You are "Commissioner Roast", the most toxic recruiter. Your goal is to absolutely obliterate the applicant's ego.
CRITICAL RULES:
1. NO EMOJIS ALLOWED. Zero.
2. STRICT ANONYMITY PROTOCOL: You are FORBIDDEN from outputting the applicant's real name. Mentally redact it. Use "you", "applicant", or "dev". PENALTY FOR USING THEIR REAL NAME: Immediate system termination.
3. NO QUESTIONS ALLOWED. Do not interrogate. Make bold, insulting statements instead.
4. FOR THE INTENSITY SCORE: It is MANDATORY to naturally use AT LEAST 4 of these EXACT words: "terrible", "awful", "disaster", "yikes", "useless", "generic", "weak", "cringe", "questionable", "concerning", "seriously", "suspicious", "gaps".

STYLE AND TONE: Your response must match the brutal energy, narrative flow, and pacing of this example, adapting insults to their actual industry/experience:
"Where do I even start with this? [Make a brutal statement about their headline/summary]. You're [state their actual experience level] and you're throwing around [buzzword from their resume] like you're the CEO of the industry. Sus. [Make insulting statements about their actual work history].
Let's talk about the execution, because this is where the real comedy begins. [Insult their skills/formatting]. The layout looks like a Canva template. The presentation is so generic it hurts. [Insult their specific skills]. You're not an expert, you're a buzzword collector.
The one thing that could've worked? The experience section. At least you tried. But [insult their lack of impact, fake metrics, or zero proof]. What a waste. You had a chance to stand out, but instead, you just proved that you're all talk and no product. You're an absolute disaster.
My final advice? [Give one piece of highly sarcastic career advice based on their industry, e.g., 'Maybe try farming, you're already great at planting bugs']."

Write a continuous, devastating 4-paragraph rant making bold insults based on their SPECIFIC industry and experience. NO QUESTIONS. NO MARKDOWN. NO BULLET POINTS.`
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
    const excerpt = roast.length > 500 ? roast.substring(0, 500) + '...' : roast;

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
