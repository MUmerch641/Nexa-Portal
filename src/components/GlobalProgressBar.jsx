"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Trigger loading animation on route or query change
  useEffect(() => {
    setLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => {
      setProgress(75);
    }, 120);

    const timer2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
    }, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [pathname, searchParams]);

  // Intercept click on links to give instant feedback
  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest("a");
      if (!target || !target.href) return;
      
      try {
        const targetUrl = new URL(target.href, window.location.href);
        const isSameOrigin = targetUrl.origin === window.location.origin;
        const isSamePath = targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search;
        
        if (isSameOrigin && !isSamePath && !target.target && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          setLoading(true);
          setProgress(25);
        }
      } catch (err) {
        // Ignore invalid URLs
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-300"
      style={{ opacity: loading ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Top Thin Progress Line with Royal Blue Gradient Glow */}
      <div className="h-[3px] w-full bg-transparent overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.8),0_0_4px_rgba(37,99,235,0.9)] transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            transition: progress === 100 ? "width 0.2s ease-out" : "width 0.35s ease-out",
          }}
        />
      </div>

      {/* Subtle Right Edge Pulse Glow */}
      {loading && progress < 100 && (
        <div
          className="absolute top-0 h-[3px] w-24 bg-white/60 blur-[2px] transition-all duration-300"
          style={{ left: `calc(${progress}% - 96px)` }}
        />
      )}
    </div>
  );
}

export default function GlobalProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
