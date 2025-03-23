import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { b2Client } from "@/lib/b2"; // Ensure this exports your configured B2 (S3-compatible) client
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chunkIndex = searchParams.get("chunk");
    const bucket = searchParams.get("bucket") || process.env.B2_DEFAULT_BUCKET!;

    if (!chunkIndex || isNaN(Number(chunkIndex))) {
      return NextResponse.json({ error: "Invalid or missing 'chunk' parameter" }, { status: 400 });
    }

    const paddedChunkValue = chunkIndex.padStart(3, "0");
    const key = `video_chunk_${paddedChunkValue}.mp4`;

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const signedUrl = await getS3SignedUrl(b2Client, command, { expiresIn: 300 });

    return NextResponse.json({ url: signedUrl });
  } catch (error: unknown) {
    console.error("❌ Error generating signed URL:", error);
    return NextResponse.json({
      error: "Failed to generate signed URL",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}