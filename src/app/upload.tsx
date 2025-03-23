 
"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize Backblaze B2 S3 Client
const s3 = new S3Client({
  region: "auto", // Backblaze does not require a region
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY!,
    secretAccessKey: process.env.B2_SECRET_KEY!,
  },
});

export async function uploadFile(formData: FormData) {
  try {
    // Handle file upload
    const file = formData.get("file") as File | null;
    if (!file) {
      console.error("No file found in FormData");
      return { error: "No file uploaded" };
    }

    console.log("File received:", file.name, file.size);

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log("Converted file to buffer");
    console.log("Using Backblaze B2 Endpoint:", process.env.B2_ENDPOINT);


    const chunkName = `chunks/${Date.now()}_${file.name}`;


    // Upload to Backblaze B2
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME!,
        Key: chunkName,
        Body: fileBuffer,
      })
    );

    console.log("Upload successful!");

    // ✅ Return a JSON-safe response
    return {
      success: true,
      message: "Upload successful",
      file: chunkName,
    };
  } catch (error) {
    console.error("Upload error:", error);

    // ✅ Return a JSON-safe error response
    return {
      success: false,
      error: "Upload failed",
      details: (error as Error).message,
    };
  }
}
