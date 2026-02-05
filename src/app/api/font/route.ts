import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Attempt to read the font file from the local filesystem
    // The user placed it in src/app/api/font/kalpurush.ttf
    // Note: In production, this might need adjustment depending on how files are bundled
    const fontPath = path.join(process.cwd(), 'src', 'app', 'api', 'font', 'kalpurush.ttf');
    
    let fontBuffer: Buffer | ArrayBuffer;

    if (fs.existsSync(fontPath)) {
        console.log(`Loading font from local path: ${fontPath}`);
        fontBuffer = fs.readFileSync(fontPath);
    } else {
        // Fallback to CDN if local file is missing
        console.warn(`Local font not found at ${fontPath}, falling back to CDN`);
        const fontUrl = "https://cdn.jsdelivr.net/npm/kalpurush-fonts@1.0.0/Kalpurush.ttf";
        const response = await fetch(fontUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch font: ${response.statusText}`);
        }
        fontBuffer = await response.arrayBuffer();
    }
    
    return new NextResponse(fontBuffer, {
      headers: {
        'Content-Type': 'font/ttf',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Font proxy error:', error);
    return NextResponse.json({ error: 'Failed to load font' }, { status: 500 });
  }
}
