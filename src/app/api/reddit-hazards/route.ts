import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET() {
    try {
        // Execute the Python script
        const scriptPath = path.join(process.cwd(), 'backend', 'reddit_analyzer.py');
        const { stdout, stderr } = await execAsync(`python "${scriptPath}"`);

        if (stderr) {
            console.error('Python script error:', stderr);
            return NextResponse.json({ error: 'Error analyzing Reddit posts' }, { status: 500 });
        }

        // Parse the JSON output from the Python script
        const analyzedPosts = JSON.parse(stdout);

        return NextResponse.json({
            success: true,
            data: analyzedPosts
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
