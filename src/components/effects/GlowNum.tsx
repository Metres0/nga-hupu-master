"use client";

interface GlowNumProps {
  value: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "text-xl", md: "text-3xl", lg: "text-6xl" };

export default function GlowNum({ value, size = "md", className = "" }: GlowNumProps) {
  return (
    <span
      className={`font-black tracking-tight ${sizeMap[size]} ${className}`}
      style={{
        color: "var(--text-primary)",
        textShadow: "0 0 14px rgba(126,184,255,0.3), 0 0 4px rgba(126,184,255,0.4)",
      }}
    >
      {value}
    </span>
  );
}
