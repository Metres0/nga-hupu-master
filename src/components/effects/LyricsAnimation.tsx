"use client";

import { useEffect, useRef, useState } from "react";

interface LyricsLineProps {
  text: string;
  active?: boolean;
  delay?: number;
  className?: string;
  color?: "cyan" | "magenta" | "amber" | "white";
}

export function LyricsLine({
  text,
  active = false,
  delay = 0,
  className = "",
  color = "cyan",
}: LyricsLineProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const colorMap = {
    cyan: "#80deea",
    magenta: "#f48fb1",
    amber: "#ffb74d",
    white: "#e2e2e9",
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || !active) return;

    let current = 0;
    const timer = setInterval(() => {
      current++;
      setVisibleChars(current);
      if (current >= text.length) clearInterval(timer);
    }, 80); // 80ms per character

    return () => clearInterval(timer);
  }, [isInView, active, text.length]);

  const baseColor = colorMap[color];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="flex flex-wrap">
        {text.split("").map((char, i) => {
          const isVisible = i < visibleChars;
          const isSpace = char === " ";

          return (
            <span
              key={i}
              className="inline-block"
              style={{
                opacity: isVisible ? 1 : 0.15,
                filter: isVisible ? "blur(0px)" : "blur(6px)",
                transform: isVisible
                  ? "translateY(0) scale(1)"
                  : "translateY(10px) scale(0.9)",
                transition: `all 0.5s cubic-bezier(0.05, 0.7, 0.1, 1) ${i * 0.03}s`,
                color: baseColor,
                textShadow: isVisible
                  ? `0 0 10px ${baseColor}80, 0 0 30px ${baseColor}40`
                  : "none",
                minWidth: isSpace ? "0.4em" : undefined,
              }}
            >
              {isSpace ? "\u00A0" : char}
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface LyricsGroupProps {
  lines: string[];
  activeIndex?: number;
  className?: string;
}

export default function LyricsGroup({ lines, activeIndex = -1, className = "" }: LyricsGroupProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {lines.map((line, i) => {
        const distance = Math.abs(i - activeIndex);
        const isActive = i === activeIndex;

        return (
          <div
            key={i}
            className="transition-all duration-700"
            style={{
              opacity: isActive ? 1 : Math.max(0.25, 1 - distance * 0.35),
              filter: isActive ? "blur(0px)" : `blur(${Math.min(4, distance * 1.5)}px)`,
              transform: isActive
                ? "translateZ(40px) scale(1.05)"
                : `translateZ(${-distance * 20}px) scale(${1 - distance * 0.05})`,
              transformStyle: "preserve-3d",
            }}
          >
            <LyricsLine
              text={line}
              active={isActive}
              delay={i * 200}
              color={isActive ? "cyan" : "white"}
              className="text-lg md:text-xl font-medium tracking-wide"
            />
          </div>
        );
      })}
    </div>
  );
}
