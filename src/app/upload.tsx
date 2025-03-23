/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import { NextResponse } from "next/server";
import fs from "fs";
import { promisify } from "util";

// Configure Multer for handling file uploads
const upload = multer({ dest: "/tmp" });
const uploadMiddleware = promisify(upload.single("file"));

// Initialize Backblaze B2 S3 Client
const s3 = new S3Client({
  region: "auto", // Backblaze does not require a region
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY!,
    secretAccessKey: process.env.B2_SECRET_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    // Handle file upload
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read file data as a buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const chunkName = `chunks/${Date.now()}_${file.name}`;

    // Upload to Backblaze B2
    const uploadParams = {
      Bucket: process.env.B2_BUCKET_NAME!,
      Key: chunkName,
      Body: fileBuffer,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    return NextResponse.json({ message: "Upload successful", file: chunkName });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
