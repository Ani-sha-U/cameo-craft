import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required field: prompt" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating video with Hugging Face, prompt:', prompt);

    const HF_TOKEN = Deno.env.get('HF_TOKEN');
    if (!HF_TOKEN) {
      throw new Error('HF_TOKEN is not configured');
    }

    // Call Hugging Face zeroscope-v2-xl model for text-to-video (updated endpoint)
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/cerspense/zeroscope-v2-xl",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/octet-stream",
        },
        body: JSON.stringify({
          inputs: `A short video of ${prompt}`
        }),
      }
    );

    console.log('HF API response status:', response.status);

    // Handle model warmup (202 Accepted) and loading (503)
    if (response.status === 202) {
      const info = await response.text();
      console.warn('Model warming up (202):', info);
      return new Response(
        JSON.stringify({ 
          error: "Model is warming up, please try again in ~20-30s",
          status: 'loading'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API error:', response.status, errorText);
      
      if (response.status === 503) {
        return new Response(
          JSON.stringify({ 
            error: "Model is loading, please try again in 20-30 seconds",
            status: 'loading'
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Video generation failed: ${errorText}`);
    }

    // Get the video as blob
    const videoBlob = await response.blob();
    
    // Convert blob to base64 for JSON response
    const arrayBuffer = await videoBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Video generated successfully, size:', videoBlob.size);

    return new Response(
      JSON.stringify({ 
        output_url: `data:video/mp4;base64,${base64}`,
        status: 'success',
        model: 'cerspense/zeroscope_v2_xl'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
