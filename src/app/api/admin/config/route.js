import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json(db.config, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, files, deadline } = body;
    const db = await readDB();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    let filePaths = [];
    if (files && Array.isArray(files)) {
      for (const file of files) {
        // Basic base64 parsing (assumes format: data:image/png;base64,iVBOR...)
        const matches = file.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1].split('/')[1] || 'png';
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `${uuidv4()}.${ext}`;
          const filePath = path.join(uploadsDir, filename);
          await fs.writeFile(filePath, buffer);
          filePaths.push(`/uploads/${filename}`);
        }
      }
    }

    if (type === 'logos') {
      db.config.logos = filePaths.length > 0 ? filePaths : db.config.logos;
    } else if (type.startsWith('logo_')) {
      const logoKey = type.split('_')[1]; // sih, ksv, vsitr
      if (['sih', 'ksv', 'vsitr'].includes(logoKey)) {
        if (!db.config.logos || Array.isArray(db.config.logos)) {
          db.config.logos = {};
        }
        db.config.logos[logoKey] = filePaths[0] || db.config.logos[logoKey];
      }
    } else if (type === 'heroMedia') {
      db.config.heroMedia = filePaths.length > 0 ? filePaths : db.config.heroMedia;
    } else if (type === 'timerConfig') {
      const { deadline: newDeadline, heading, buttonText, buttonLink, footerText } = body;
      db.config.deadline = newDeadline !== undefined ? newDeadline : db.config.deadline;
      db.config.registrationHeading = heading !== undefined ? heading : db.config.registrationHeading;
      db.config.registrationButtonText = buttonText !== undefined ? buttonText : db.config.registrationButtonText;
      db.config.registrationButtonLink = buttonLink !== undefined ? buttonLink : db.config.registrationButtonLink;
      db.config.registrationFooterText = footerText !== undefined ? footerText : db.config.registrationFooterText;
    }

    await writeDB(db);

    return NextResponse.json({ success: true, config: db.config }, { status: 200 });
  } catch (error) {
    console.error("Config Update Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
