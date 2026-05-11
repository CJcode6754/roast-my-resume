import { useState, useEffect } from 'react';

export function LoadingSection() {
  const messages = [
    'Reviewing submitted document',
    'Cross-referencing career claims',
    'Documenting professional deficiencies',
    'Calculating concern index'
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="inline-block animate-spin mb-3">
          <div className="w-8 h-8 border-2 border-ink-red border-t-transparent rounded-full"></div>
        </div>
        <p className="font-body text-ink-muted text-sm">{messages[messageIndex]}...</p>
      </div>
    </div>
  );
}