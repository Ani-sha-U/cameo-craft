import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.3.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert base64 to blob
async function base64ToBlob(base64: string): Promise<Blob> {
  const base64Data = base64.split(',')[1] || base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes]);
}

// Helper to create transparent PNG from mask
async function createTransparentPNG(
  originalImage: Blob,
  mask: ImageData,
  boundingBox: { x: number; y: number; width: number; height: number }
): Promise<string> {
  // This would need canvas manipulation, but in Deno we'll use the mask data directly
  // For now, return the original with metadata
  const arrayBuffer = await originalImage.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return `data:image/png;base64,${base64}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frameImage, useMock = true } = await req.json();
    
    if (!frameImage) {
      return new Response(
        JSON.stringify({ error: "Missing frameImage" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MOCK MODE - Return sample separated elements
    if (useMock) {
      console.log('Mock mode: Simulating element separation for frame:', frameImage.substring(0, 50));
      
      // Generate mock transparent PNG elements as base64
      const mockElements = [
        {
          id: 'element_0',
          label: 'Main Character',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzg4NDRmZiIgcng9IjIwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5DaGFyYWN0ZXI8L3RleHQ+PC9zdmc+',
          score: 0.95
        },
        {
          id: 'element_1',
          label: 'Background Object',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI3NSIgY3k9Ijc1IiByPSI3MCIgZmlsbD0iIzIyYzU1ZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+T2JqZWN0PC90ZXh0Pjwvc3ZnPg==',
          score: 0.87
        },
        {
          id: 'element_2',
          label: 'Foreground Item',
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cG9seWdvbiBwb2ludHM9IjkwLDIwIDE3MCwxNjAgMTAsMTYwIiBmaWxsPSIjZjk3MzE2Ii8+PHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JdGVtPC90ZXh0Pjwvc3ZnPg==',
          score: 0.82
        }
      ];

      const elements = mockElements;

      return new Response(
        JSON.stringify({ 
          elements,
          success: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // REAL MODE - AI-powered element separation
    console.log('Real mode: Processing frame with AI segmentation');
    
    const HF_TOKEN = Deno.env.get('HF_TOKEN');
    if (!HF_TOKEN) {
      return new Response(
        JSON.stringify({ 
          error: 'HF_TOKEN not configured',
          success: false
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hf = new HfInference(HF_TOKEN);
    
    try {
      // Convert base64 image to blob
      const imageBlob = await base64ToBlob(frameImage);
      
      // Use Hugging Face's image segmentation API
      // Using facebook/detr-resnet-50-panoptic for object detection and segmentation
      const segmentationResult = await hf.imageSegmentation({
        data: imageBlob,
        model: 'facebook/detr-resnet-50-panoptic'
      });

      console.log('Segmentation completed, found', segmentationResult.length, 'segments');

      // Process each detected segment
      const elements = [];
      for (let i = 0; i < Math.min(segmentationResult.length, 10); i++) {
        const segment = segmentationResult[i];
        
        // Fetch the mask image and convert to base64
        let maskBase64 = '';
        try {
          // Mask is typically a URL string from HuggingFace API
          const maskResponse = await fetch(segment.mask as string);
          const maskBlob = await maskResponse.blob();
          const maskArrayBuffer = await maskBlob.arrayBuffer();
          maskBase64 = btoa(String.fromCharCode(...new Uint8Array(maskArrayBuffer)));
        } catch (maskError) {
          console.error('Error processing mask:', maskError);
          // Use original frame as fallback for this element
          maskBase64 = frameImage.split(',')[1] || frameImage;
        }
        
        elements.push({
          id: `element_${i}`,
          label: segment.label || `Object ${i + 1}`,
          image: `data:image/png;base64,${maskBase64}`,
          score: segment.score || 0.8,
          mask: `data:image/png;base64,${maskBase64}`
        });
      }

      if (elements.length === 0) {
        console.log('No elements detected, falling back to full frame');
        // If no objects detected, return the full frame as a single element
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        elements.push({
          id: 'element_0',
          label: 'Full Frame',
          image: `data:image/png;base64,${base64}`,
          score: 1.0
        });
      }

      return new Response(
        JSON.stringify({ 
          elements,
          success: true,
          count: elements.length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (apiError: unknown) {
      console.error('HuggingFace API error:', apiError);
      
      // Fallback: Return original frame as single element if API fails
      const imageBlob = await base64ToBlob(frameImage);
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
      
      return new Response(
        JSON.stringify({ 
          elements: [{
            id: 'element_0',
            label: 'Full Frame (API Error)',
            image: `data:image/png;base64,${base64}`,
            score: 1.0
          }],
          success: true,
          warning: 'Segmentation API failed, returning full frame',
          error: errorMessage
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

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