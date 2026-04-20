"use client";

import { useEffect, useState, useRef } from "react";
import { SERVERS, FALLBACK_MESSAGE } from "@/config/servers";

interface RedirectorProps {
  tmdbId: string;
  type: "movie" | "tv";
  season?: string;
  episode?: string;
}

export default function Redirector({ tmdbId, type, season, episode }: RedirectorProps) {
  const [status, setStatus] = useState("Connecting...");
  const [serverIndex, setServerIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle animation background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let animId: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 38, 38, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Server rotation logic
  useEffect(() => {
    async function startRotation() {
      const lastIndexStr = localStorage.getItem("last_server_index");
      let currentIndex = lastIndexStr ? (parseInt(lastIndexStr) + 1) % SERVERS.length : 0;

      const triedIndices = new Set<number>();

      while (triedIndices.size < SERVERS.length) {
        const serverUrl = SERVERS[currentIndex];
        setServerIndex(currentIndex);
        setStatus(`Checking Server ${currentIndex + 1} of ${SERVERS.length}`);
        setProgress(((triedIndices.size + 1) / SERVERS.length) * 100);

        try {
          const targetPath =
            type === "movie"
              ? `/movie/${tmdbId}`
              : `/tv/${tmdbId}/${season}/${episode}`;
          const fullTargetUrl = `${serverUrl}${targetPath}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

          let isAccessible = false;
          try {
            // Call our own API to check the target server (bypasses CORS and reads body)
            const checkUrl = `/api/check-health?url=${encodeURIComponent(fullTargetUrl)}`;
            const response = await fetch(checkUrl, { signal: controller.signal });
            
            if (response.ok) {
              const data = await response.json();
              if (data.ok) {
                isAccessible = true;
              } else {
                console.warn(`Server ${currentIndex} is not accessible: ${data.reason || data.error}`);
              }
            }
          } catch (fetchError) {
            console.error(`Error calling health-check API for server ${currentIndex}:`, fetchError);
          }

          clearTimeout(timeoutId);

          if (isAccessible) {
            localStorage.setItem("last_server_index", currentIndex.toString());
            setStatus("Optimal Server Found!");
            setProgress(100);

            // Small delay for visual feedback
            await new Promise((r) => setTimeout(r, 800));
            window.location.replace(fullTargetUrl);
            return;
          } else {
            throw new Error("Server check failed");
          }
        } catch (err) {
          console.error(`Server ${currentIndex} failed accessibility check:`, err);
          triedIndices.add(currentIndex);
          currentIndex = (currentIndex + 1) % SERVERS.length;
        }
      }

      setError(FALLBACK_MESSAGE);
    }

    startRotation();
  }, [tmdbId, type, season, episode]);

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-6 relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-600/8 blur-[150px] rounded-full" />

        <div className="z-10 max-w-lg w-full text-center">
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight">
              <span className="text-white">T</span>
              <span className="text-red-600">Movie</span>
              <span className="text-white/40 text-lg font-light">.in</span>
            </h1>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl rounded-3xl p-10 border border-white/[0.06] shadow-2xl">
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-red-600/20 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
              <div className="relative w-24 h-24 bg-gradient-to-br from-red-600/20 to-red-900/20 rounded-full flex items-center justify-center border border-red-500/20">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-white">Content Not Available</h2>
            <p className="text-gray-400 mb-10 leading-relaxed text-sm">{error}</p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 active:scale-[0.98] shadow-lg shadow-red-600/25 flex items-center justify-center gap-2"
              >
                Try Again
              </button>
              <a
                href="https://www.tmovie.in"
                className="block w-full bg-white/[0.05] hover:bg-white/[0.08] text-gray-300 font-medium py-3.5 rounded-xl transition-all duration-300 border border-white/[0.06]"
              >
                Go to TMovie.in
              </a>
            </div>
          </div>
          <p className="mt-8 text-gray-600 text-xs">www.tmovie.in • Smart Fallback Engine</p>
        </div>
      </div>
    );
  }

  // ── Loading State ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060606] overflow-hidden relative">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/[0.04] blur-[150px] rounded-full animate-pulse" style={{ animationDuration: "3s" }} />

      <div className="z-10 text-center">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tight">
            <span className="text-white">T</span>
            <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">Movie</span>
            <span className="text-white/30 text-xl font-light">.in</span>
          </h1>
        </div>

        <div className="relative inline-block mb-10">
          <div className="w-28 h-28 border-[3px] border-white/[0.04] border-t-red-600 rounded-full animate-spin" style={{ animationDuration: "1.2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-10 h-10 bg-white/[0.03] backdrop-blur-md rounded-full flex items-center justify-center border border-white/[0.06]">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.6)]" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-white/80 font-medium text-sm tracking-wide">{status}</p>
          <div className="w-48 h-1 bg-white/[0.06] rounded-full mx-auto overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {serverIndex !== null && (
            <p className="text-gray-600 text-xs italic">Optimizing experience for you...</p>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-gray-500 text-xs font-medium tracking-widest">www.tmovie.in</p>
      </div>
    </div>
  );
}
