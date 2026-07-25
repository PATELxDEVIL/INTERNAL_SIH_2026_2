import { NextResponse } from 'next/server';
import { getProblems, createProblem, toggleProblemLive, deleteProblem } from '@/lib/db';

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
      // Store the raw base64 string directly in the database
      // since Vercel serverless functions have a read-only filesystem.
      pdfUrl = pdfFile.data;
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
    if (action === 'delete' && id) {
      await deleteProblem(id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Problems PUT Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
