import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chunk = searchParams.get("chunk");

  if (!chunk) {
    return NextResponse.json({ error: "Missing chunk parameter" }, { status: 400 });
  }

  try {
    const chunkPath = path.join(process.cwd(), 'public', 'chunks', `chunk_${chunk.padStart(3, '0')}.mp4`);
    if (!fs.existsSync(chunkPath)) {
      console.error(`❌ Chunk not found: ${chunkPath}`);
      return NextResponse.json({ error: `Chunk not found at ${chunkPath}` }, { status: 404 });
    }

    console.log(`✅ Found chunk ${chunk} at ${chunkPath}`);
    return NextResponse.json({ url: `/chunks/chunk_${chunk.padStart(3, '0')}.mp4` });
  } catch (err) {
    console.error("❌ Error retrieving chunk:", err);
    return NextResponse.json({ error: "Failed to retrieve chunk", details: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}