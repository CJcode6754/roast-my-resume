import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useGroqRoast() {
  const [roast, setRoast] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateRoast = async ({ resumeText, systemPrompt }) => {
    setLoading(true);
    setError(null);
    setRoast('');

    try {
      // Call the secure Supabase Edge Function instead of calling Groq directly
      const { data, error: funcError } = await supabase.functions.invoke('roast', {
        body: { resumeText, systemPrompt },
      });

      if (funcError) throw funcError;
      
      // The function returns the full Groq response
      if (data.error) throw new Error(data.error.message || 'AI processing error');

      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('No evaluation received from the Bureau.');

      setRoast(text);
    } catch (err) {
      console.error('Roast error:', err);
      setError(err.message || 'Evaluation failed. The Bureau is currently busy.');
    } finally {
      setLoading(false);
    }
  };

  return { roast, loading, error, generateRoast };
}
