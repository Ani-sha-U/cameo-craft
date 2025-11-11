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
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: "Missing required field: image" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating video with Hugging Face Stable Video Diffusion');

    const HF_TOKEN = Deno.env.get('HF_TOKEN');
    if (!HF_TOKEN) {
      throw new Error('HF_TOKEN is not configured');
    }

    // Convert base64 image to binary
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Call Hugging Face Stable Video Diffusion image-to-video model
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-video-diffusion-img2vid-xt",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
          Accept: "video/mp4",
          "X-Wait-For-Model": "true",
          "X-Use-Cache": "false",
        },
        body: binaryData,
      }
    );

    console.log('HF API response status:', response.status);

    // Handle model warmup (503)
    if (response.status === 503) {
      const errorText = await response.text();
      console.warn('Model loading (503):', errorText);
      return new Response(
        JSON.stringify({ 
          error: "Model is warming up — please retry after 20 seconds",
          status: 'loading'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API error:', response.status, errorText);
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
        model: 'stabilityai/stable-video-diffusion-img2vid-xt'
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
