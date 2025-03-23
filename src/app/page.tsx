'use client';

import { useEffect, useState, useRef } from 'react';

const PLAYLIST = [
  { bucket: "PixelFlow-vid-1", totalChunks: 2 },
  { bucket: "PixelFlow-vid-2", totalChunks: 1 },
];

export default function StreamPlayer() {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadChunk = async (chunk: number, bucket: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/get-signed-url?chunk=${chunk}&bucket=${bucket}`);
      const data = await res.json();
      if (res.ok && data.url) {
        console.log(`✅ Loaded chunk ${chunk} from bucket ${bucket}`);
        return data.url;
      } else {
        console.error("❌ Failed to load video chunk:", data.error || res.statusText);
        return null;
      }
    } catch (err) {
      console.error("❌ Error fetching signed URL:", err);
      return null;
    }
  };

  // Load current and preload next chunk
  useEffect(() => {
    const { bucket, totalChunks } = PLAYLIST[currentVideoIndex];

    setLoading(true);
    loadChunk(currentChunk, bucket).then((url) => {
      if (url) setVideoUrl(url);
      setLoading(false);
    });

    // Preload next chunk or next video
    (async () => {
      const isLastChunk = currentChunk + 1 >= totalChunks;
      if (!isLastChunk) {
        const nextChunkUrl = await loadChunk(currentChunk + 1, bucket);
        if (nextChunkUrl) setNextUrl(nextChunkUrl);
      } else if (currentVideoIndex + 1 < PLAYLIST.length) {
        const nextVideo = PLAYLIST[currentVideoIndex + 1];
        const firstChunkNextVideo = await loadChunk(0, nextVideo.bucket);
        if (firstChunkNextVideo) setNextUrl(firstChunkNextVideo);
      } else {
        setNextUrl(null); // No more videos
      }
    })();
  }, [currentChunk, currentVideoIndex]);

  const handleEnded = () => {
    const current = PLAYLIST[currentVideoIndex];
    const nextChunk = currentChunk + 1;

    if (nextUrl) {
      setVideoUrl(nextUrl);
      setNextUrl(null);
    }

    if (nextChunk < current.totalChunks) {
      setCurrentChunk(nextChunk);
    } else if (currentVideoIndex + 1 < PLAYLIST.length) {
      setCurrentVideoIndex((prev) => prev + 1);
      setCurrentChunk(0);
    } else {
      console.log("🎉 All videos played");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Streaming Video</h1>

      {loading && <p className="text-sm text-gray-500">Loading chunk...</p>}

      {videoUrl ? (
        <video
          key={videoUrl}
          ref={videoRef}
          autoPlay
          preload="auto"
          controls
          onEnded={handleEnded}
          className="w-full max-w-3xl mt-4 rounded-lg shadow-md"
          src={videoUrl}
        />
      ) : (
        !loading && <p className="text-red-500 mt-4">No video available.</p>
      )}
    </div>
  );
}