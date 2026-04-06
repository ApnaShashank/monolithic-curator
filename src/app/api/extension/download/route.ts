import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import AdmZip from 'adm-zip';

export async function GET() {
  try {
    const extensionPath = path.join(process.cwd(), 'extension');
    
    const zip = new AdmZip();
    zip.addLocalFolder(extensionPath);
    
    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="brain-cache-extension.zip"',
      },
    });
  } catch (error) {
    console.error('GET /api/extension/download error:', error);
    return NextResponse.json({ error: 'Failed to generate extension bundle' }, { status: 500 });
  }
}
