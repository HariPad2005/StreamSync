"use client";

import { useState } from "react";
import { uploadFile } from "./upload"; // Import the server function

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    // 🚨 Do NOT use fetch()! Call the function directly.
    const result = await uploadFile(formData);

    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage(`Upload successful: ${result.file}`);
    }

    setUploading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold">Upload Video to Backblaze B2</h1>
      <input type="file" onChange={handleFileChange} className="mt-4 p-2 border" />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p className="mt-2 text-lg">{message}</p>}
    </main>
  );
}
