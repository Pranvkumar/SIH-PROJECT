import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Try to run the real web scraper
    const scraperPath = path.join(process.cwd(), 'python-services', 'real_web_scraper.py');
    const venvPath = path.join(process.cwd(), 'python-services', 'venv');
    
    // Use the virtual environment Python executable
    const pythonExe = process.platform === 'win32' 
      ? path.join(venvPath, 'Scripts', 'python.exe')
      : path.join(venvPath, 'bin', 'python');
    
    // Run Python scraper with virtual environment
    const pythonProcess = spawn(pythonExe, [scraperPath], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let scraperData = '';
    let scraperError = '';
    
    pythonProcess.stdout.on('data', (data) => {
      scraperData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      scraperError += data.toString();
    });
    
    // Wait for scraper to complete with timeout
    const scraperResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Scraper timeout'));
      }, 30000); // 30 second timeout
      
      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          try {
            // Try to parse JSON from the last line of output
            const lines = scraperData.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            if (lastLine.startsWith('{')) {
              resolve(JSON.parse(lastLine));
            } else {
              reject(new Error('No JSON output from scraper'));
            }
          } catch (e) {
            reject(new Error('Failed to parse scraper output'));
          }
        } else {
          reject(new Error(`Scraper failed with code ${code}: ${scraperError}`));
        }
      });
    });
    
    if (scraperResult && typeof scraperResult === 'object') {
      return NextResponse.json({
        success: true,
        data: scraperResult,
        message: 'Live data from real web scraper - NOAA, Reddit, RSS feeds'
      });
    }
    
  } catch (error) {
    console.error('Web scraper error, falling back to test data:', error);
  }
  
  // Fallback to test data if scraper fails
  console.log('Using test data for social media integration demo');
  
  const testDataResponse = await fetch(`${request.nextUrl.origin}/api/social-media/test-data`);
  if (testDataResponse.ok) {
    const testData = await testDataResponse.json();
    return NextResponse.json({
      success: true,
      data: testData.data,
      message: 'Using test data - web scraper temporarily unavailable'
    });
  }

  // Final fallback
  return NextResponse.json({
    success: false,
    message: 'Could not load social media data',
    data: { posts: [], analytics: null, count: 0 }
  });
}
