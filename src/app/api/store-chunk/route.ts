import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chunk = searchParams.get("chunk");
  const bucket = searchParams.get("bucket");

  if (!chunk || !bucket) {
    return NextResponse.json({ error: "Missing chunk or bucket parameter" }, { status: 400 });
  }

  try {
    const chunkUrl = `https://${bucket}.s3.us-west-002.backblazeb2.com/video_chunk_${chunk.padStart(3, '0')}.mp4`;
    const res = await fetch(chunkUrl);

    if (!res.ok) {
      console.error(`❌ Failed to fetch chunk from Backblaze: ${res.statusText}`);
      return NextResponse.json({ error: `Failed to fetch chunk from Backblaze: ${res.statusText}` }, { status: 500 });
    }

    const chunksDir = path.join(process.cwd(), 'public', 'chunks');
    if (!fs.existsSync(chunksDir)) {
      fs.mkdirSync(chunksDir, { recursive: true });
    }

    const chunkBuffer = await res.arrayBuffer();
    const chunkPath = path.join(chunksDir, `chunk_${chunk.padStart(3, '0')}.mp4`);
    fs.writeFileSync(chunkPath, Buffer.from(chunkBuffer));

    console.log(`✅ Stored chunk ${chunk} in ${chunkPath}`);
    return NextResponse.json({ url: `/chunks/chunk_${chunk.padStart(3, '0')}.mp4` });
  } catch (err) {
    console.error("❌ Error storing chunk:", err);
    return NextResponse.json({ error: "Failed to store chunk", details: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}