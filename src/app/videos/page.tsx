"use client";
import { useState, useEffect } from "react";
import { getSignedVideoUrl } from "../generateSignedUrl"  ; // Import the function


export default function VideoPlayer() {
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const url = await getSignedVideoUrl("chunks/1742716708090_In His TIme _ Lyric Video.mp4"); // Directly call function
        setVideoUrl(url);
      } catch (error) {
        console.error("Error fetching signed URL:", error);
      }
    }
    fetchSignedUrl();
  }, []);

  return (
    <div>
      <h2>Video Streaming</h2>
      {videoUrl ? (
        <video controls width="720">
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
