import { useState } from 'react';

const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

export function useGeminiRoast() {
  const [roast, setRoast] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRoast = async ({ apiKey, parts, systemPrompt }) => {
    setLoading(true);
    setError('');
    setRoast('');

    try {
      const res = await fetch(GEMINI_URL(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts }],
          generationConfig: { maxOutputTokens: 900, temperature: 1.1 }
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No evaluation received. Please try again.');

      setRoast(text);
    } catch (err) {
      setError(err.message || 'Evaluation failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return { roast, loading, error, generateRoast };
}