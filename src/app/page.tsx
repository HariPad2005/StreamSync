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
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadChunk = async (chunk: number, bucket: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/get-signed-url?chunk=${chunk}&bucket=${bucket}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch signed URL: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.url) {
        console.log(`✅ Loaded chunk ${chunk} from bucket ${bucket}`);
        return data.url;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      console.error("❌ Error fetching signed URL:", err);
      return null;
    }
  };

  const storeChunkOnServer = async (chunk: number, bucket: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/store-chunk?chunk=${chunk}&bucket=${bucket}`);
      if (!res.ok) {
        throw new Error(`Failed to store chunk: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.url) {
        console.log(`✅ Stored chunk ${chunk} from bucket ${bucket} on server`);
        return data.url;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      console.error("❌ Error storing chunk on server:", err);
      return null;
    }
  };

  const getStoredChunk = async (chunk: number, bucket: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/get-stored-chunk?chunk=${chunk}&bucket=${bucket}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch stored chunk: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.url) {
        console.log(`✅ Retrieved stored chunk ${chunk} from bucket ${bucket}`);
        return data.url;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      console.error("❌ Error fetching stored chunk:", err);
      return null;
    }
  };

  useEffect(() => {
    const { bucket, totalChunks } = PLAYLIST[currentVideoIndex];

    setLoading(true);
    loadChunk(currentChunk, bucket).then((url) => {
      if (url) setVideoUrl(url);
      setLoading(false);
    });

    // Preload and store the next chunk on the server
    (async () => {
      const isLastChunk = currentChunk + 1 >= totalChunks;
      if (!isLastChunk) {
        const nextChunkUrl = await storeChunkOnServer(currentChunk + 1, bucket);
        if (nextChunkUrl) console.log('Next chunk stored on server:', nextChunkUrl);
      } else if (currentVideoIndex + 1 < PLAYLIST.length) {
        const nextVideo = PLAYLIST[currentVideoIndex + 1];
        const firstChunkNextVideo = await storeChunkOnServer(0, nextVideo.bucket);
        if (firstChunkNextVideo) console.log('Next chunk stored on server:', firstChunkNextVideo);
      }
    })();
  }, [currentChunk, currentVideoIndex]);

  const handleEnded = () => {
    const current = PLAYLIST[currentVideoIndex];
    const nextChunk = currentChunk + 1;
  
    if (nextChunk < current.totalChunks) {
      getStoredChunk(nextChunk, current.bucket)
        .then((url) => {
          if (url) {
            setVideoUrl(url);
            setCurrentChunk(nextChunk);
  
            if (nextChunk + 1 < current.totalChunks) {
              storeChunkOnServer(nextChunk + 1, current.bucket).catch((err) => {
                console.error("❌ Error preloading next chunk:", err);
              });
            }
          } else {
            console.error("❌ Chunk not found on server, fetching directly...");
            loadChunk(nextChunk, current.bucket).then((url) => {
              if (url) {
                setVideoUrl(url);
                setCurrentChunk(nextChunk);
              }
            });
          }
        })
        .catch((err) => {
          console.error("❌ Error fetching stored chunk:", err);
          loadChunk(nextChunk, current.bucket).then((url) => {
            if (url) {
              setVideoUrl(url);
              setCurrentChunk(nextChunk);
            }
          });
        });
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
          muted // Added muted attribute
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