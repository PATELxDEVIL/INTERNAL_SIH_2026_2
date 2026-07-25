import { NextResponse } from 'next/server';
import { getProblems, createProblem, toggleProblemLive } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const problems = await getProblems();
    return NextResponse.json({ success: true, problems });
  } catch (error) {
    console.error("Problems GET Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, description, pdfFile } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let pdfUrl = null;
    if (pdfFile && pdfFile.data) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const matches = pdfFile.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `${uuidv4()}.pdf`;
        await fs.writeFile(path.join(uploadsDir, filename), buffer);
        pdfUrl = `/uploads/${filename}`;
      }
    }

    const id = await createProblem({ title, description: description || '', pdfUrl });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Problems POST Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, action } = await req.json();
    if (action === 'toggle_live' && id) {
      await toggleProblemLive(id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Problems PUT Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
