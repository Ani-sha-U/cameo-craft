import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory job storage (for prototype - use database in production)
const jobs = new Map<string, any>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Status check
    if (body.jobId) {
      const job = jobs.get(body.jobId);
      
      if (!job) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(job),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Start new render job
    const { format, clips, cameraKeyframes, elements, frames, totalDuration } = body;
    
    if (!clips || clips.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No clips provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const jobId = `render-${Date.now()}`;
    
    console.log('Starting render job:', jobId);
    console.log('Format:', format);
    console.log('Clips:', clips.length);
    console.log('Camera keyframes:', cameraKeyframes?.length || 0);
    console.log('Elements:', elements?.length || 0);
    console.log('Frames:', frames?.length || 0);
    
    // Initialize job
    jobs.set(jobId, {
      status: 'processing',
      progress: 0,
      step: 'Initializing...',
    });
    
    // Background processing
    processRenderJob(jobId, clips, cameraKeyframes, elements, frames, format);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        jobId,
        message: 'Render job started'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in render-video function:', error);
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

// Background render processor
async function processRenderJob(
  jobId: string,
  clips: any[],
  cameraKeyframes: any[],
  elements: any[],
  frames: any[],
  format: string
) {
  try {
    // Step 1: Download clips
    jobs.set(jobId, {
      status: 'processing',
      progress: 20,
      step: 'Downloading video clips...',
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Apply transitions
    jobs.set(jobId, {
      status: 'processing',
      progress: 40,
      step: 'Applying transitions...',
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Apply camera movements
    jobs.set(jobId, {
      status: 'processing',
      progress: 60,
      step: 'Applying camera keyframes...',
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Process frames and composite elements
    if (frames && frames.length > 0) {
      jobs.set(jobId, {
        status: 'processing',
        progress: 70,
        step: 'Processing frames...',
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Composite frame elements
      const totalElements = frames.reduce((sum: number, frame: any) => 
        sum + (frame.elements?.length || 0), 0);
      
      if (totalElements > 0) {
        jobs.set(jobId, {
          status: 'processing',
          progress: 80,
          step: `Compositing ${totalElements} frame layers...`,
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else if (elements && elements.length > 0) {
      jobs.set(jobId, {
        status: 'processing',
        progress: 75,
        step: 'Compositing layers...',
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Step 5: Encode
    jobs.set(jobId, {
      status: 'processing',
      progress: 90,
      step: `Encoding ${format}...`,
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For prototype: return the first clip URL
    // In production: process with ffmpeg and upload to storage
    const mockUrl = clips[0]?.videoUrl || 'https://example.com/output.mp4';
    
    jobs.set(jobId, {
      status: 'completed',
      progress: 100,
      step: 'Complete!',
      url: mockUrl,
    });
    
    console.log('Render job completed:', jobId);
    
  } catch (error) {
    console.error('Render job failed:', error);
    jobs.set(jobId, {
      status: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}