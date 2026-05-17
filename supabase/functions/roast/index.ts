import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// In-memory backend rate limiting (IP-based)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // IP Rate limiting check
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  if (ip !== 'unknown') {
    const limitData = rateLimitMap.get(ip);
    if (limitData && limitData.resetTime > now) {
      if (limitData.count >= 15) { // 15 requests per hour hard limit
        return new Response(JSON.stringify({ error: 'Backend rate limit exceeded. Too many requests.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        });
      }
      limitData.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + 3600000 }); // 1 hour reset
    }
  }

  console.log('Function invoked: roast');

  try {
    if (!GROQ_API_KEY) {
      console.error('CRITICAL: GROQ_API_KEY is not set in environment variables!');
      throw new Error('The Bureau is missing its secret decryption key (GROQ_API_KEY).');
    }

    const { resumeText, systemPrompt } = await req.json()
    if (!resumeText) throw new Error('Resume text is required')

    console.log('Sending request to Groq API...');
    
    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Evaluate this resume:\n\n${resumeText}` }
        ],
        temperature: 1.1,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      return new Response(JSON.stringify({ error: 'Groq API error', details: errorText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      })
    }

    const data = await response.json()
    clearTimeout(timeoutId);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
