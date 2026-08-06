"use client";

import { useRef, useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function ScrollableTabs({ children, className = "" }) {
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [children]);

  const scroll = (direction) => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.65;
    containerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={`relative flex items-center w-full group ${className}`}>
      {/* Left Arrow Button (◀) */}
      {showLeftArrow && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md border border-slate-200 backdrop-blur-xs hover:bg-slate-900 hover:text-white hover:border-slate-800 transition-all cursor-pointer -translate-x-3 focus:outline-none"
          aria-label="Scroll Tabs Left"
          title="Scroll Left"
        >
          <FaChevronLeft className="text-xs" />
        </button>
      )}

      {/* Scrollable Tabs Track with Hidden Scrollbar via CSS */}
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full py-1 px-1"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children}
      </div>

      {/* Right Arrow Button (▶) */}
      {showRightArrow && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md border border-slate-200 backdrop-blur-xs hover:bg-slate-900 hover:text-white hover:border-slate-800 transition-all cursor-pointer translate-x-3 focus:outline-none"
          aria-label="Scroll Tabs Right"
          title="Scroll Right"
        >
          <FaChevronRight className="text-xs" />
        </button>
      )}
    </div>
  );
}
