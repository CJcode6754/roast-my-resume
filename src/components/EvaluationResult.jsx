import { useEffect, useState, useRef } from 'react';
import { getIntensity } from '../utils/intensityScore';

export function EvaluationResult({ roast }) {
  const [displayedText, setDisplayedText] = useState('');
  const [intensity, setIntensity] = useState(38);
  const textRef = useRef('');

  useEffect(() => {
    if (!roast) {
      setDisplayedText('');
      setIntensity(38);
      return;
    }

    textRef.current = roast;
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex < roast.length) {
        setDisplayedText(roast.substring(0, charIndex + 1));
        charIndex++;
        setTimeout(typeChar, 15);
      } else {
        setIntensity(getIntensity(roast));
      }
    };

    typeChar();
  }, [roast]);

  if (!displayedText) return null;

  return (
    <div className="mb-6 border-l-4 border-ink-red pl-4 pr-4 pt-4 pb-4 bg-paper/50">
      <label className="block text-xs font-body text-ink-muted mb-3 tracking-wider">OFFICIAL EVALUATOR'S REMARKS</label>
      <p className="font-body text-ink text-sm leading-relaxed mb-4 whitespace-pre-wrap">{displayedText}</p>

      <div className="space-y-2 mt-6">
        <div className="flex justify-between items-center">
          <span className="text-xs font-body text-ink-muted">Career Concern Index</span>
          <span className="text-sm font-body text-ink-red font-bold">{intensity}/100</span>
        </div>
        <div className="w-full h-3 bg-paper border border-rule relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-ink-red to-ink-red transition-all duration-500"
            style={{ width: `${intensity}%` }}
          ></div>
        </div>
      </div>

      <button
        onClick={() => navigator.clipboard.writeText(roast)}
        className="mt-4 px-3 py-2 text-xs font-display text-ink bg-rule hover:bg-rule/80 transition border border-rule"
      >
        Copy to Clipboard
      </button>
    </div>
  );
}