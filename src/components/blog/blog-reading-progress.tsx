"use client";

import { useEffect, useState } from "react";

export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const article = document.getElementById("blog-article-content");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const start = window.scrollY + rect.top;
      const height = article.offsetHeight;
      const viewport = window.innerHeight;
      const scrolled = window.scrollY - start + viewport * 0.2;
      const total = height - viewport * 0.3;
      setProgress(Math.min(100, Math.max(0, (scrolled / total) * 100)));
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="fixed left-0 top-0 z-[60] h-1 w-full bg-[var(--color-card-border)]/80"
      aria-hidden
    >
      <div
        className="h-full bg-gradient-to-r from-[var(--color-green)] to-[var(--color-cta)] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
