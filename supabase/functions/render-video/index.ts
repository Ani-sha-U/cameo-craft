import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Status check
    if (body.jobId) {
      const { data: job, error } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('id', body.jobId)
        .single();
      
      if (error || !job) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({
          status: job.status,
          progress: job.progress,
          step: job.step,
          url: job.output_url,
          error: job.error
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Start new render job
    const { format, clips, cameraKeyframes, elements, frames, composedFrames, fps, totalDuration } = body;
    
    // Use either composed frames or clips
    if ((!clips || clips.length === 0) && (!composedFrames || composedFrames.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'No clips or composed frames provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const jobId = `render-${Date.now()}`;
    
    console.log('Starting render job:', jobId);
    console.log('Format:', format);
    console.log('Clips:', clips?.length || 0);
    console.log('Composed frames:', composedFrames?.length || 0);
    console.log('FPS:', fps || 24);
    console.log('Camera keyframes:', cameraKeyframes?.length || 0);
    console.log('Elements:', elements?.length || 0);
    console.log('Frames:', frames?.length || 0);
    
    // Initialize job in database
    await supabase.from('render_jobs').insert({
      id: jobId,
      format,
      status: 'processing',
      progress: 0,
      step: 'Initializing...',
    });
    
    // Background processing
    processRenderJob(jobId, clips, cameraKeyframes, elements, frames, composedFrames, fps, format);
    
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
  composedFrames: string[], // Base64 data URLs of composed frames
  fps: number,
  format: string
) {
  try {
    // If we have composed frames, use those directly
    if (composedFrames && composedFrames.length > 0) {
      await supabase.from('render_jobs').update({
        status: 'processing',
        progress: 50,
        step: `Encoding ${composedFrames.length} composed frames to ${format}...`,
      }).eq('id', jobId);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In a real implementation, you would:
      // 1. Decode base64 images
      // 2. Use FFmpeg to encode them into a video at the specified FPS
      // 3. Upload to storage
      // 4. Return the URL
      
      await supabase.from('render_jobs').update({
        status: 'processing',
        progress: 80,
        step: 'Uploading rendered video...',
      }).eq('id', jobId);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock output URL (in production, this would be the actual uploaded video)
      const mockOutputUrl = `https://example.com/rendered-${jobId}.${format.split('-')[0]}`;
      
      await supabase.from('render_jobs').update({
        status: 'completed',
        progress: 100,
        step: 'Render complete!',
        output_url: mockOutputUrl,
      }).eq('id', jobId);
      
      console.log('Render completed:', jobId);
      return;
    }
    
    // Otherwise, use the legacy clip-based workflow
    // Step 1: Download clips
    await supabase.from('render_jobs').update({
      status: 'processing',
      progress: 20,
      step: 'Downloading video clips...',
    }).eq('id', jobId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Apply transitions
    await supabase.from('render_jobs').update({
      status: 'processing',
      progress: 40,
      step: 'Applying transitions...',
    }).eq('id', jobId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Apply camera movements
    await supabase.from('render_jobs').update({
      status: 'processing',
      progress: 60,
      step: 'Applying camera keyframes...',
    }).eq('id', jobId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Process frames and composite elements
    if (frames && frames.length > 0) {
      await supabase.from('render_jobs').update({
        status: 'processing',
        progress: 70,
        step: 'Processing frames...',
      }).eq('id', jobId);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Composite frame elements
      const totalElements = frames.reduce((sum: number, frame: any) => 
        sum + (frame.elements?.length || 0), 0);
      
      if (totalElements > 0) {
        await supabase.from('render_jobs').update({
          status: 'processing',
          progress: 80,
          step: `Compositing ${totalElements} frame layers...`,
        }).eq('id', jobId);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else if (elements && elements.length > 0) {
      await supabase.from('render_jobs').update({
        status: 'processing',
        progress: 75,
        step: 'Compositing layers...',
      }).eq('id', jobId);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Step 5: Encode
    await supabase.from('render_jobs').update({
      status: 'processing',
      progress: 90,
      step: `Encoding ${format}...`,
    }).eq('id', jobId);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For prototype: return the first clip URL
    // In production: process with ffmpeg and upload to storage
    const mockUrl = clips[0]?.videoUrl || 'https://example.com/output.mp4';
    
    await supabase.from('render_jobs').update({
      status: 'completed',
      progress: 100,
      step: 'Complete!',
      output_url: mockUrl,
    }).eq('id', jobId);
    
    console.log('Render job completed:', jobId);
    
  } catch (error) {
    console.error('Render job failed:', error);
    await supabase.from('render_jobs').update({
      status: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }).eq('id', jobId);
  }
}