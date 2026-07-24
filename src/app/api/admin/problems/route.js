import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({ success: true, problems: db.problemStatements || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { title, description, pdfFile } = await req.json(); // pdfFile = { name, data: base64string }
    const db = await readDB();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    await fs.mkdir(uploadsDir, { recursive: true });

    let pdfUrl = null;
    if (pdfFile && pdfFile.data) {
      const matches = pdfFile.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1].split('/')[1] || 'pdf';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `${uuidv4()}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, buffer);
        pdfUrl = `/uploads/${filename}`;
      }
    }

    const newProblem = {
      id: `PS-${uuidv4().substring(0, 8)}`,
      title,
      description,
      pdfUrl,
      isLive: false,
      createdAt: new Date().toISOString()
    };

    if (!db.problemStatements) db.problemStatements = [];
    db.problemStatements.push(newProblem);
    await writeDB(db);

    return NextResponse.json({ success: true, problem: newProblem }, { status: 200 });
  } catch (error) {
    console.error("Problem Creation Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, action } = await req.json();
    const db = await readDB();
    
    if (!db.problemStatements) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    const index = db.problemStatements.findIndex(p => p.id === id);
    if (index === -1) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

    if (action === 'toggle_live') {
      db.problemStatements[index].isLive = !db.problemStatements[index].isLive;
      await writeDB(db);
      return NextResponse.json({ success: true, problem: db.problemStatements[index] }, { status: 200 });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
