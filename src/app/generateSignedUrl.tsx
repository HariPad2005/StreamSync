"use server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 Client
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.B2_ENDPOINT, // Example: https://s3.us-west-004.backblazeb2.com
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY!,
    secretAccessKey: process.env.B2_SECRET_KEY!,
  },
});

// Function to generate a signed URL
export async function getSignedVideoUrl(fileName: string): Promise<string> {
  if (!fileName) throw new Error("File name is required");

  console.log("filename: ",fileName); // Should print your endpoint
  console.log("Bucket Name:", process.env.B2_BUCKET_NAME!); // Should print your bucket name

  const command = new GetObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME!,
    Key: fileName,
  });

  const signedUrl= await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1-hour expiry
  return signedUrl;
}
