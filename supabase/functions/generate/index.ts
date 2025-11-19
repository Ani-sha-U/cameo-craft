import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, duration = 5, predictionId, useMock = true } = await req.json();
    
    // MOCK MODE - Return sample videos immediately
    if (useMock) {
      // Mock video URLs for testing
      const mockVideos = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      ];
      
      if (predictionId) {
        // Mock status check - return completed
        console.log('Mock mode: Checking status for prediction:', predictionId);
        const mockIndex = parseInt(predictionId.split('-')[1] || '0') % mockVideos.length;
        
        return new Response(
          JSON.stringify({
            status: 'succeeded',
            video_url: mockVideos[mockIndex],
            error: null
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: "Missing required field: prompt" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Mock mode: Generating video for prompt:', prompt);
      const mockId = `mock-${Date.now()}`;
      
      return new Response(
        JSON.stringify({ 
          status: 'processing',
          prediction_id: mockId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // REAL MODE - Use Replicate API
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');
    if (!REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });

    // If predictionId is provided, check status
    if (predictionId) {
      console.log('Checking status for prediction:', predictionId);
      const prediction = await replicate.predictions.get(predictionId);
      console.log('Prediction status:', prediction.status);
      
      return new Response(
        JSON.stringify({
          status: prediction.status,
          video_url: prediction.output,
          error: prediction.error
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Otherwise, start new video generation
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required field: prompt" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting video generation with minimax/video-01, prompt:', prompt);

    // Start prediction (non-blocking)
    const prediction = await replicate.predictions.create({
      version: "minimax/video-01",
      input: {
        prompt: prompt,
        duration: duration
      }
    });

    console.log('Prediction started:', prediction.id);

    return new Response(
      JSON.stringify({ 
        status: 'processing',
        prediction_id: prediction.id
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
