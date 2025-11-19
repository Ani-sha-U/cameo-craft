import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.3.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, frameIndex = 0 } = await req.json();
    
    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "Missing videoUrl" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const HF_TOKEN = Deno.env.get('HF_TOKEN');
    if (!HF_TOKEN) {
      throw new Error('HF_TOKEN is not configured');
    }

    console.log('Processing element separation for video:', videoUrl);

    const hf = new HfInference(HF_TOKEN);

    // For prototype: Extract a single frame and process it
    // In production, you'd process multiple frames
    const videoResponse = await fetch(videoUrl);
    const videoBlob = await videoResponse.blob();

    // Use background removal model (rembg equivalent)
    const segmentationResult = await hf.imageSegmentation({
      data: videoBlob,
      model: 'briaai/RMBG-1.4'
    });

    console.log('Segmentation completed');

    // Convert segmentation result to base64
    const elements = await Promise.all(
      segmentationResult.map(async (segment, idx) => {
        const maskResponse = await fetch(segment.mask);
        const maskBlob = await maskResponse.blob();
        const arrayBuffer = await maskBlob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        return {
          id: `element_${idx}`,
          label: segment.label || `Object ${idx + 1}`,
          image: `data:image/png;base64,${base64}`,
          score: segment.score || 0
        };
      })
    );

    return new Response(
      JSON.stringify({ 
        elements,
        frameIndex,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in separateElements function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});