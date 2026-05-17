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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Safety timeout for the frontend request
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${supabaseUrl}/functions/v1/roast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ resumeText, systemPrompt }),
        signal: controller.signal
      });

      clearTimeout(id);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.error('Unauthorized - Session expired');
        throw new Error('Your session has expired. Please log in again.');
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with ${response.status}`);
      }
      
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
