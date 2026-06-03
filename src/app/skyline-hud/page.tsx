"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import EnhancedStarryBg from "@/components/effects/EnhancedStarryBg";
import GlowNum from "@/components/effects/GlowNum";
import { LyricsLine } from "@/components/effects/LyricsAnimation";

/* ═══════════════════════════════════════════
   3D Parallax & Float Components
   ═══════════════════════════════════════════ */
function Float3D({ children, depth = 0, className = "", style }: {
  children: React.ReactNode; depth?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf: number, mx = 0, my = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => { const r = el.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = ((e.clientY - r.top) / r.height - 0.5) * 2; };
    const onLeave = () => { mx = 0; my = 0; };
    const animate = () => { cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06; el.style.transform = `perspective(1000px) rotateY(${cx * 5}deg) rotateX(${-cy * 3}deg)`; raf = requestAnimationFrame(animate); };
    window.addEventListener("mousemove", onMove); el.addEventListener("mouseleave", onLeave); raf = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className={className} style={{ transformStyle: "preserve-3d", transition: "transform 0.15s ease-out", ...style }}>{children}</div>;
}

function FloatCard({ children, depth = 0, className = "", style }: {
  children: React.ReactNode; depth?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const delay = useRef(Math.random() * 2);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.transform = `translateZ(${10 + depth * 10}px)`;
      return;
    }
    let raf: number, start = performance.now();
    const animate = (t: number) => { const dt = (t - start) / 1000 + delay.current; const y = Math.sin(dt * 0.8) * 6; const r = Math.cos(dt * 0.5) * 2; el.style.transform = `translateY(${y}px) rotateX(${r * 0.5}deg) translateZ(${10 + depth * 10}px)`; raf = requestAnimationFrame(animate); };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [depth]);
  return <div ref={ref} className={className} style={{ transformStyle: "preserve-3d", transition: "transform 0.3s ease-out", ...style }}>{children}</div>;
}

/* ═══════════════════════════════════════════
   Core Parameters Card
   ═══════════════════════════════════════════ */
function SpecCard({ label, value, unit, highlight }: { label: string; value: string; unit?: string; highlight?: boolean }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-center" style={highlight ? { borderColor: "rgba(126,184,255,0.35)", background: "linear-gradient(135deg, rgba(126,184,255,0.08) 0%, rgba(126,184,255,0.02) 100%)" } : undefined}>
      <span className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-tertiary)] mb-2">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black tracking-tight" style={{ color: highlight ? "var(--md-primary)" : "var(--text-primary)", textShadow: highlight ? "0 0 14px rgba(126,184,255,0.3)" : "none" }}>{value}</span>
        {unit && <span className="text-sm text-[var(--text-tertiary)]">{unit}</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HUD Scene — 3-mode adaptive layout
   ═══════════════════════════════════════════ */
const HUD_CARDS = [
  { id: "media", label: "媒体", value: "夜曲", unit: "", icon: "♫" },
  { id: "range", label: "续航", value: "680", unit: "km", icon: "⚡" },
  { id: "speed", label: "车速", value: "120", unit: "km/h", icon: "◎" },
  { id: "nav", label: "导航", value: "500m", unit: "右转", icon: "➤" },
  { id: "adas", label: "驾驶辅助", value: "领航", unit: "", icon: "◈" },
];

function HUDPanel() {
  const [mode, setMode] = useState<"straight" | "turn-left" | "turn-right">("straight");

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-primary)]" style={{ boxShadow: "0 0 8px rgba(126,184,255,0.6)" }} />
          <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-secondary)]">Sky Screen</span>
        </div>
        <div className="flex gap-1.5">
          {(["straight", "turn-left", "turn-right"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full text-[10px] tracking-[0.12em] uppercase transition-all ${
                mode === m ? "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] border border-[var(--md-primary)]/30" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >{m === "straight" ? "直行" : m === "turn-left" ? "左转" : "右转"}</button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl overflow-hidden border border-[var(--md-outline-variant)]"
        style={{ background: "var(--md-surface-container-lowest)", aspectRatio: "21/9", minHeight: "210px", position: "relative" }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(126,184,255,0.08) 0%, transparent 55%)" }} />

        <div className="absolute inset-0 flex items-center justify-center p-6">
          {mode === "straight" && (
            <div className="grid grid-cols-5 gap-4 w-full">
              {HUD_CARDS.map((c) => (
                <div key={c.id} className="text-center">
                  <div className="text-[10px] text-[var(--text-tertiary)] mb-2 tracking-[0.12em] uppercase">{c.label}</div>
                  {c.id === "speed" ? (
                    <GlowNum value={c.value} size="lg" className="text-5xl" />
                  ) : c.id === "range" ? (
                    <GlowNum value={c.value} size="md" className="text-3xl" />
                  ) : (
                    <div className="text-xl font-medium text-[var(--text-primary)]">{c.value}</div>
                  )}
                  {c.unit && <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{c.unit}</div>}
                </div>
              ))}
            </div>
          )}

          {mode === "turn-left" && (
            <div className="grid grid-cols-3 gap-6 w-full items-center">
              <div className="aspect-video rounded-xl border border-[var(--md-primary)]/30 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(20,30,55,0.9) 0%, rgba(10,20,40,0.95) 100%)", boxShadow: "0 0 20px rgba(126,184,255,0.08)" }}>
                <span className="text-2xl opacity-40">📷</span>
              </div>
              <div className="text-center">
                <GlowNum value="45" size="lg" />
                <span className="text-xs text-[var(--text-tertiary)] ml-1">km/h</span>
              </div>
              <div className="text-center">
                <div className="text-lg text-[var(--text-primary)]">← 200m</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">前方左转</div>
              </div>
            </div>
          )}

          {mode === "turn-right" && (
            <div className="grid grid-cols-3 gap-6 w-full items-center">
              <div className="text-center">
                <div className="text-lg text-[var(--text-primary)]">200m →</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">前方右转</div>
              </div>
              <div className="text-center">
                <GlowNum value="45" size="lg" />
                <span className="text-xs text-[var(--text-tertiary)] ml-1">km/h</span>
              </div>
              <div className="aspect-video rounded-xl border border-[var(--md-primary)]/30 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(20,30,55,0.9) 0%, rgba(10,20,40,0.95) 100%)", boxShadow: "0 0 20px rgba(126,184,255,0.08)" }}>
                <span className="text-2xl opacity-40">📷</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   903 Zone Grid Canvas
   ═══════════════════════════════════════════ */
const ZONE_COLS = 33, ZONE_ROWS = 28, ZONE_COUNT = ZONE_COLS * ZONE_ROWS;

const ZONE_COLORS = [
  [126,184,255], [107,212,240], [162,216,224], [107,150,240], [80,180,220],
];

function ZoneGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const cell = 10, gap = 1, W = ZONE_COLS * (cell + gap) + gap, H = ZONE_ROWS * (cell + gap) + gap;
    c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px";
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    let raf: number, time = 0;
    const draw = () => {
      time += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (let row = 0; row < ZONE_ROWS; row++) {
        for (let col = 0; col < ZONE_COLS; col++) {
          const nx = col / ZONE_COLS, ny = row / ZONE_ROWS;
          const w1 = Math.sin(time + col * 0.4 + row * 0.3) * 0.5 + 0.5;
          const w2 = Math.sin(time * 0.7 + col * 0.35 - row * 0.25) * 0.5 + 0.5;
          const w3 = Math.sin(time * 1.3 - col * 0.2 + row * 0.5) * 0.5 + 0.5;
          const center = Math.max(0, 1 - Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2) * 1.6);
          const brightness = Math.min(1, Math.max(0, w1 * 0.30 + w2 * 0.25 + w3 * 0.15 + center * 0.30));
          const ci = Math.min(4, Math.floor(brightness * 5));
          const color = ZONE_COLORS[ci];
          const r = Math.round(3 + color[0] * brightness * 0.35);
          const g = Math.round(6 + color[1] * brightness * 0.30);
          const b = Math.round(14 + color[2] * brightness * 0.40);
          const px = col * (cell + gap) + gap;
          const py = row * (cell + gap) + gap;
          ctx.fillStyle = `rgba(${r},${g},${b},1)`;
          ctx.fillRect(px, py, cell, cell);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: "var(--md-surface-container-lowest)" }}>
      <canvas ref={canvasRef} className="block w-full" style={{ imageRendering: "pixelated" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 20%, rgba(5,10,22,0.85) 100%)" }} />
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8">
        <div className="text-center"><div className="text-2xl font-black text-[var(--md-primary)]" style={{ textShadow: "0 0 14px rgba(126,184,255,0.3)" }}>{ZONE_COUNT}</div><div className="text-[10px] text-[var(--text-tertiary)]">独立分区</div></div>
        <div className="text-center"><div className="text-2xl font-black text-[var(--md-secondary)]" style={{ textShadow: "0 0 10px rgba(107,212,240,0.3)" }}>1200</div><div className="text-[10px] text-[var(--text-tertiary)]">nits 峰值</div></div>
        <div className="text-center"><div className="text-2xl font-black text-[var(--md-tertiary)]" style={{ textShadow: "0 0 10px rgba(142,216,224,0.3)" }}>∞</div><div className="text-[10px] text-[var(--text-tertiary)]">对比度</div></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Optical Path SVG Animation
   ═══════════════════════════════════════════ */
function OpticalPath() {
  const [step, setStep] = useState(0);
  const steps = ["屏幕发光", "光学镜片反射", "风挡下黑区显示", "驾驶员视角"];
  useEffect(() => {
    const i = setInterval(() => setStep((s) => (s + 1) % 4), 3000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/5" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(8,16,32,0.98) 100%)" }}>
      <div className="text-xs text-[var(--text-secondary)] mb-4 tracking-wider uppercase">光学路径示意</div>
      <div className="flex gap-2 mb-6">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex-1 py-2 rounded-full text-[10px] tracking-[0.1em] uppercase transition-all ${i === step ? "bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] border border-[var(--md-primary)]/30 font-medium" : "text-[var(--text-tertiary)] border border-[var(--md-outline-variant)] hover:text-[var(--text-secondary)]"}`}
          >{s}</button>
        ))}
      </div>
      <div className="aspect-[21/9] rounded-xl flex items-center justify-center" style={{ background: "var(--md-surface-container-lowest)", border: "1px solid var(--md-outline-variant)" }}>
        <svg viewBox="0 0 800 200" className="w-full h-full">
          <defs>
            <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="var(--md-secondary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--md-primary)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Screen */}
          <rect x={50} y={80} width={120} height={40} rx={8} fill="none" stroke={step >= 0 ? "var(--md-primary)" : "var(--md-outline-variant)"} strokeWidth={1.5} opacity={step >= 0 ? 1 : 0.3} />
          <text x={110} y={105} textAnchor="middle" fill="var(--text-secondary)" fontSize={10}>Mini LED</text>
          {/* Path 1 */}
          <path d="M170 100 C 280 100, 300 60, 400 80" fill="none" stroke="url(#pathGrad)" strokeWidth={step >= 1 ? 2 : 0.5} opacity={step >= 1 ? 1 : 0.2} />
          {/* Mirror */}
          <line x1={380} y1={60} x2={420} y2={100} stroke={step >= 1 ? "var(--md-secondary)" : "var(--md-outline-variant)"} strokeWidth={2} opacity={step >= 1 ? 1 : 0.3} />
          <text x={435} y={85} fill="var(--text-secondary)" fontSize={10}>光学镜片</text>
          {/* Path 2 */}
          <path d="M430 90 C 520 110, 540 50, 600 70" fill="none" stroke="url(#pathGrad)" strokeWidth={step >= 2 ? 2 : 0.5} opacity={step >= 2 ? 1 : 0.2} />
          {/* Windshield */}
          <path d="M560 50 Q 600 30, 640 50 L 650 120 Q 600 140, 550 120 Z" fill="none" stroke={step >= 2 ? "var(--md-tertiary)" : "var(--md-outline-variant)"} strokeWidth={1.5} opacity={step >= 2 ? 1 : 0.3} />
          <text x={600} y={95} textAnchor="middle" fill="var(--text-secondary)" fontSize={9}>风挡玻璃</text>
          {/* Path 3 */}
          <path d="M640 70 C 700 80, 720 90, 750 90" fill="none" stroke="url(#pathGrad)" strokeWidth={step >= 3 ? 2.5 : 0.5} opacity={step >= 3 ? 1 : 0.2} />
          {/* Eye */}
          <circle cx={760} cy={90} r={6} fill="none" stroke={step === 3 ? "var(--md-primary)" : "var(--md-outline-variant)"} strokeWidth={step === 3 ? 2 : 1} opacity={step >= 3 ? 1 : 0.3} />
          <circle cx={762} cy={88} r={2} fill="var(--md-primary)" opacity={step === 3 ? 0.8 : 0.1} />
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Distortion Comparison
   ═══════════════════════════════════════════ */
function DistortionGhost() {
  const [distort, setDistort] = useState(0);
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-4">畸变矫正算法</div>
        <div className="aspect-video rounded-xl overflow-hidden border border-[var(--md-outline-variant)] relative" style={{ background: "var(--md-surface-container-lowest)" }}>
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 gap-px" style={{ transform: `perspective(800px) rotateX(${distort}deg) rotateY(${distort * 0.5}deg)`, transition: "transform 0.5s" }}>
            {Array.from({ length: 32 }, (_, i) => <div key={i} className="border border-[rgba(126,184,255,0.15)]" style={{ background: `rgba(126,184,255,${0.04 + (i % 8) * 0.015})` }} />)}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black" style={{ color: "var(--md-primary)", textShadow: "0 0 14px rgba(126,184,255,0.3)", transform: `perspective(800px) rotateX(${distort}deg) rotateY(${distort * 0.5}deg)`, transition: "transform 0.5s" }}>120 km/h</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-tertiary)] w-14">畸变 {distort.toFixed(1)}°</span>
          <input type="range" min="0" max="15" step="0.5" value={distort} onChange={(e) => setDistort(parseFloat(e.target.value))} className="flex-1 h-1 rounded-full appearance-none accent-[var(--md-primary)]" style={{ background: "rgba(126,184,255,0.15)" }} />
          <button onClick={() => setDistort(0)} className="px-3 py-1 rounded-full text-[10px] bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] border border-[var(--md-primary)]/30">矫正</button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-4">楔形 PVB 零重影</div>
        <svg viewBox="0 0 400 200" className="w-full">
          <defs>
            <linearGradient id="wedgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--md-primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--md-secondary)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {/* Wedge PVB layer */}
          <polygon points="50,140 350,100 350,130 50,170" fill="url(#wedgeGrad)" stroke="var(--md-primary)" strokeWidth={1.5} opacity={0.8} />
          <text x={200} y={145} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>楔形PVB</text>
          {/* Light rays */}
          <line x1={100} y1={30} x2={50} y2={140} stroke="var(--md-primary)" strokeWidth={1} opacity={0.3} />
          <line x1={300} y1={30} x2={350} y2={100} stroke="var(--md-primary)" strokeWidth={1} opacity={0.3} />
          <line x1={200} y1={20} x2={200} y2={120} stroke="var(--md-secondary)" strokeWidth={0.8} opacity={0.2} strokeDasharray="4,3" />
          {/* Label */}
          <text x={200} y={185} textAnchor="middle" fill="var(--text-tertiary)" fontSize={10}>△ 楔角 = 消除二次反射</text>
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */
const TECHS = [
  { title: "Mini LED + COB 封装", desc: "三块 Mini LED 屏幕，COB 封装技术实现超高像素密度 108PPD，每个 LED 芯片直接贴装在基板上，减少光损失。" },
  { title: "光学反射系统", desc: "精密光学镜片组将画面反射到前挡风玻璃下黑区，通过自由曲面镜片设计实现 1.1m 超宽显示，畸变 < 1%。" },
  { title: "超黑显示涂层 SCE", desc: "内嵌超黑显示涂层，反射率 SCE < 1%，透光率 ≤ 0.01%，有效消除环境光干扰，确保强光下画面清晰。" },
  { title: "畸变矫正算法", desc: "融合畸变矫正算法，针对自由曲面反射的光学畸变进行实时数字矫正，实现零重影、畸变率 < 1%。" },
  { title: "903 分区控光", desc: "全局 903 个独立控光分区，每个分区可独立调节亮度，实现 1200nits 峰值亮度和近乎无限的对比度。" },
  { title: "智能场景适配", desc: "根据驾驶场景动态切换信息显示：直行显示车速/导航/续航，转向时在后视镜附近展示盲区影像。" },
];

const PROMPT_SECTIONS = [
  { title: "视觉风格", content: "panoramic HUD display, windshield projection, Mini LED backlight, ultra-wide 1.1m screen, glassmorphism overlay, dark navy background, cyan glow accents, floating information cards, anti-reflection coating" },
  { title: "3D 透视交互", content: "Float3D mouse parallax → perspective(1000px) rotateX/Y via requestAnimationFrame lerp, FloatCard sin-wave float translateZ animation" },
  { title: "CSS 关键属性", content: "backdrop-filter: blur(20px) saturate(150%), perspective: 1000px, transform-style: preserve-3d, radial-gradient for light halos, text-shadow for HUD glow" },
  { title: "Canvas 粒子系统", content: "EnhancedStarryBg: 300 星 + 十字光芒 + 40 粒子 三层径向辉光 + 3 星云层 + 流星拖尾渐变 + 903 分区 Canvas 实时亮度波模拟" },
];

export default function SkylineHUDPage() {
  const [lyricIdx, setLyricIdx] = useState(0);
  const titleLines = ["全景显示系统", "Xiaomi Sky Screen", "YU7 天际屏"];
  const descLines = ["三块 Mini LED · 1.1m 超宽 · 108PPD 视网膜级", "903 独立控光分区 · 1200nits 可视峰值亮度"];

  useEffect(() => {
    const i = setInterval(() => setLyricIdx((p) => (p + 1) % titleLines.length), 3500);
    return () => clearInterval(i);
  }, [titleLines.length]);

  return (
    <>
      <EnhancedStarryBg />
      <div className="max-w-4xl mx-auto px-5 py-10 relative z-10">
        {/* ═══ Hero ═══ */}
        <Float3D depth={2} className="mb-12" style={{ transformStyle: "preserve-3d" }}>
          <div className="glass-card-elevated rounded-3xl p-8 md:p-12 relative overflow-hidden skyline-reflection">
            <div className="relative z-10">
              {/* Lyrics title cascade */}
              <div className="mb-6" style={{ perspective: "800px" }}>
                {titleLines.map((line, i) => {
                  const dist = Math.abs(i - lyricIdx);
                  const active = i === lyricIdx;
                  return (
                    <div key={i} className="transition-all duration-700" style={{
                      opacity: active ? 1 : Math.max(0.25, 1 - dist * 0.35),
                      filter: active ? "blur(0px)" : `blur(${Math.min(4, dist * 1.5)}px)`,
                      transform: active ? "translateZ(40px) scale(1.05)" : `translateZ(${-dist * 20}px) scale(${1 - dist * 0.05})`,
                    }}>
                      <LyricsLine text={line} active={active} color="cyan" className="text-2xl md:text-3xl font-bold tracking-tight" />
                    </div>
                  );
                })}
              </div>

              {/* Description */}
              <div className="mb-6 space-y-1">
                {descLines.map((line, i) => (
                  <LyricsLine key={i} text={line} active={true} color="white" className="text-sm md:text-base" />
                ))}
              </div>

              {/* Info box */}
              <div className="mb-5 p-4 rounded-2xl border border-[var(--md-outline-variant)]" style={{ background: "var(--md-surface-container-lowest)" }}>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  划破天际，突破想象 — 三块 Mini LED 屏幕，将信息直接反射到前风挡下黑区，
                  实现 1.1m 超宽全景显示，108PPD 超视网膜级高清显示，1200nits 可视峰值亮度，
                  全局 903 分区控光。
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {["Mini LED", "COB封装", "1.1m超宽", "108PPD", "1200nits", "903分区", "零重影", "畸变<1%"].map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full text-[10px] font-medium border border-[var(--md-primary)]/30" style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-container)" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Float3D>

        {/* ═══ Core Parameters ═══ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--md-primary)] to-[var(--md-secondary)]" />
            核心参数
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <SpecCard label="显示宽度" value="1.1" unit="m" highlight />
            <SpecCard label="像素密度" value="108" unit="PPD" />
            <SpecCard label="峰值亮度" value="1200" unit="nits" highlight />
            <SpecCard label="分区控光" value="903" unit="区" />
            <SpecCard label="反射率 SCE" value="<1" unit="%" />
            <SpecCard label="透光率" value="≤0.01" unit="%" />
            <SpecCard label="畸变率" value="<1" unit="%" />
            <SpecCard label="重影" value="零" highlight />
            <SpecCard label="对比度" value="∞" />
            <SpecCard label="响应" value="<1" unit="ms" highlight />
          </div>
        </section>

        {/* ═══ Optical Path ═══ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--md-primary)] to-[var(--md-secondary)]" />
            光学路径
          </h2>
          <OpticalPath />
        </section>

        {/* ═══ HUD Scene ═══ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--md-primary)] to-[var(--md-secondary)]" />
            全景 HUD 交互演示
          </h2>
          <Float3D depth={1} className="glass-card rounded-3xl p-6">
            <HUDPanel />
          </Float3D>
        </section>

        {/* ═══ Zone Grid ═══ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--md-primary)] to-[var(--md-secondary)]" />
            Mini LED 分区控光可视化
          </h2>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[var(--text-secondary)]">903 个独立控光分区</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">实时亮度波模拟</span>
            </div>
            <ZoneGrid />
          </div>
        </section>

        {/* ═══ Distortion & Ghosting ═══ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--md-primary)] to-[var(--md-secondary)]" />
            光学矫正技术
          </h2>
          <DistortionGhost />
        </section>

        {/* ═══ Six Core Technologies ═══ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--md-primary)] to-[var(--md-secondary)]" />
            六大核心技术
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {TECHS.map((item, i) => (
              <FloatCard key={i} depth={i % 2 + 1} className="glass-card rounded-2xl p-5 group">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xs text-[var(--md-primary)] font-black">{(i + 1).toString().padStart(2, "0")}</span>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm">{item.title}</h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </FloatCard>
            ))}
          </div>
        </section>

        {/* ═══ Key Prompts ═══ */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--md-primary)] to-[var(--md-secondary)]" />
            关键提示词
          </h2>
          <div className="glass-card rounded-2xl p-6 font-mono text-xs" style={{ background: "linear-gradient(135deg, rgba(4,8,20,0.99) 0%, rgba(2,6,23,0.99) 100%)" }}>
            <div className="space-y-5">
              {PROMPT_SECTIONS.map((s, i) => (
                <div key={i}>
                  <div className="text-[var(--md-primary)] mb-1.5">{i + 1}. {s.title}</div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{s.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
