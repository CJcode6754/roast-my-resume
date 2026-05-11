import { useState } from 'react';
import { DocumentHeader } from './components/DocumentHeader';
import { DropZone } from './components/DropZone';
import { LoadingSection } from './components/LoadingSection';
import { EvaluationResult } from './components/EvaluationResult';
import { useGeminiRoast } from './hooks/useGeminiRoast';

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

export default function App() {
  const apiKey = import.meta.env.VITE_API_KEY;
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('taglish');
  const [uploadError, setUploadError] = useState('');
  const { roast, loading, error, generateRoast } = useGeminiRoast();

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setUploadError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (!file) {
      setUploadError('Resume file is required.');
      return;
    }

    let parts = [];

    if (file.type === 'application/pdf') {
      try {
        const ab = await file.arrayBuffer();
        const bytes = new Uint8Array(ab);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        parts = [
          { inline_data: { mime_type: 'application/pdf', data: base64 } },
          { text: 'This is the resume. Write your official evaluation remarks.' }
        ];
      } catch (err) {
        setUploadError('Failed to process PDF file.');
        return;
      }
    } else if (file.type === 'text/plain') {
      try {
        const text = await file.text();
        const trimmed = text.substring(0, 10000);
        parts = [{ text: `Resume:\n\n${trimmed}\n\nWrite your official evaluation remarks.` }];
      } catch (err) {
        setUploadError('Failed to read text file.');
        return;
      }
    }

    generateRoast({
      apiKey,
      parts,
      systemPrompt: SYSTEM_PROMPTS[language]
    });
  };

  const handleReset = () => {
    setFile(null);
    setLanguage('taglish');
    setUploadError('');
  };

  return (
    <div className="min-h-screen bg-paper-bg p-8 font-body">
      <div className="max-w-2xl mx-auto bg-paper p-8 shadow-lg" style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #c8b88a 39px, #c8b88a 40px)'}}>
        <DocumentHeader />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section I - File Upload */}
          <DropZone onFileSelect={handleFileSelect} disabled={loading} error={uploadError} />

          {/* Section II - Language */}
          <div>
            <label className="block text-xs font-body text-ink-muted mb-2 tracking-wider">SECTION II – EVALUATION PARAMETERS</label>
            <label className="block text-xs font-body text-ink-muted mb-3">LANGUAGE OF REPORT</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="taglish"
                  checked={language === 'taglish'}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={loading}
                  className="w-4 h-4"
                />
                <span className="text-sm font-body text-ink">Taglish (Filipino + English)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="english"
                  checked={language === 'english'}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={loading}
                  className="w-4 h-4"
                />
                <span className="text-sm font-body text-ink">English Only</span>
              </label>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs font-body text-ink-muted leading-relaxed p-3 border-l-2 border-rule">
            By submitting, you authorize the Bureau to conduct a thorough assessment of your professional shortcomings.
            No personal data is stored. Results are for entertainment purposes only. Bureau assumes no liability for wounded pride.
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !file || !apiKey}
              className="flex-1 px-4 py-3 font-display text-ink bg-rule hover:bg-rule/80 disabled:opacity-50 disabled:cursor-not-allowed transition border-2 border-ink"
            >
              {loading ? 'Evaluating...' : 'Submit for Evaluation'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-3 font-body text-sm text-ink border border-rule hover:bg-paper/50 disabled:opacity-50 transition"
            >
              New Submission
            </button>
          </div>
        </form>

        {/* Loading state */}
        {loading && <LoadingSection />}

        {/* Error display */}
        {error && !loading && (
          <div className="mt-6 p-3 bg-ink-red/10 border border-ink-red text-ink-red text-sm font-body">
            {error}
          </div>
        )}

        {/* Results */}
        {roast && !loading && <EvaluationResult roast={roast} />}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-double border-ink text-center">
          <div className="text-xs font-body text-ink-muted tracking-wider">RESUME ROASTER – OFFICIAL EVALUATION BUREAU</div>
          <div className="text-xs font-body text-ink-muted">gemini 2.0 flash • Free Tier</div>
        </div>
      </div>
    </div>
  );
}
