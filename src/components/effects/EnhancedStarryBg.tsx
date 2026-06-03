"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number; r: number; hue: number;
  baseAlpha: number; speed: number; phase: number;
}
interface Particle {
  x: number; y: number; size: number; tier: "large" | "medium" | "small";
  vx: number; vy: number; color: [number,number,number]; pulseSpeed: number; phase: number;
}
interface Meteor {
  x: number; y: number; vx: number; vy: number; life: number; maxLife: number; length: number; color: [number,number,number];
}

const PARTICLE_COLORS: [number,number,number][] = [
  [64,224,255],[138,180,248],[167,139,250],[45,212,191],[232,121,249],
  [56,189,248],[99,102,241],[20,184,166],[168,85,247],[52,211,153],
  [125,211,252],[147,197,253],
];

function spawnMeteor(w: number, h: number): Meteor {
  const angle = Math.random() * 0.5 + 0.4; // 0.4-0.9 rad (~23-52 deg)
  const vx = (Math.random() * 5 + 3);
  const vy = (Math.random() * 3 + 1);
  return {
    x: Math.random() * w * 0.6,
    y: Math.random() * h * 0.3,
    vx: Math.cos(angle) * (Math.random() * 5 + 3),
    vy: Math.sin(angle) * (Math.random() * 3 + 1),
    life: 0,
    maxLife: 2000 + Math.random() * 3000,
    length: 40 + Math.random() * 80,
    color: [Math.random() > 0.5 ? 255 : 200, 200 + Math.random() * 55, 255],
  };
}

export default function EnhancedStarryBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1;
    const stars: Star[] = [];
    const particles: Particle[] = [];
    const nebulaGradients: CanvasGradient[] = [];
    let meteors: Meteor[] = [];
    let meteorTimer = 0;
    let time = 0;
    let rafId = 0;

    function resize() {
      if (!canvas || !ctx) return;
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.scale(dpr, dpr);
      initAll();
    }

    function initAll() {
      stars.length = 0; particles.length = 0; meteors = [];
      for (let i = 0; i < 150; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 2.2 + 0.3,
          hue: 200 + Math.random() * 60,
          baseAlpha: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 0.03 + 0.005,
          phase: Math.random() * Math.PI * 2,
        });
      }
      const tiers = [["large",0.3,8,20], ["medium",0.25,4,10], ["small",0.3,1.5,4.5]] as const;
      for (const [tier, ratio, minSize, maxSize] of tiers) {
        const count = Math.floor(20 * ratio);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * w, y: Math.random() * h,
            size: minSize + Math.random() * (maxSize - minSize),
            tier: tier as "large" | "medium" | "small",
            vx: tier === "large" ? (Math.random() - 0.5) * 0.4 : (Math.random() - 0.5) * 0.9,
            vy: tier === "large" ? (Math.random() - 0.5) * 0.4 : (Math.random() - 0.5) * 0.9,
            color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
            pulseSpeed: (Math.random() * 0.04 + 0.01),
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
      initNebulae();
    }

    function initNebulae() {
      if (!ctx) return;
      nebulaGradients.length = 0;
      const ctx2 = ctx;
      const g1 = ctx2.createRadialGradient(w * 0.25, h * 0.30, 0, w * 0.25, h * 0.30, Math.max(w, h) * 0.25);
      g1.addColorStop(0, "rgba(64,224,255,0.04)"); g1.addColorStop(0.5, "rgba(138,180,248,0.02)"); g1.addColorStop(1, "rgba(0,0,0,0)");
      nebulaGradients.push(g1);
      const g2 = ctx2.createRadialGradient(w * 0.70, h * 0.55, 0, w * 0.70, h * 0.55, Math.max(w, h) * 0.2);
      g2.addColorStop(0, "rgba(167,139,250,0.03)"); g2.addColorStop(0.5, "rgba(64,224,255,0.02)"); g2.addColorStop(1, "rgba(0,0,0,0)");
      nebulaGradients.push(g2);
    }

    function draw(timestamp: number) {
      if (!ctx) return;
      time += 0.016;
      ctx.clearRect(0, 0, w, h);

      // nebula layers
      for (const g of nebulaGradients) {
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }

      // stars
      for (const s of stars) {
        const twinkle = Math.sin(time * s.speed * 45 + s.phase);
        const alpha = s.baseAlpha * (0.2 + 0.8 * twinkle);
        if (alpha < 0.03) continue;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 80%, 75%, ${alpha})`;
        ctx.fill();

        // radial glow for all stars
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
        g.addColorStop(0, `hsla(${s.hue}, 80%, 75%, ${alpha * 0.3})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();

        // cross rays for large stars
        if (s.r > 1.5) {
          const rayAlpha = alpha * 0.20;
          ctx.strokeStyle = `hsla(${s.hue}, 50%, 85%, ${rayAlpha})`;
          ctx.lineWidth = s.r > 2 ? 0.6 : 0.3;
          ctx.beginPath();
          ctx.moveTo(s.x - s.r * 5, s.y); ctx.lineTo(s.x + s.r * 5, s.y);
          ctx.moveTo(s.x, s.y - s.r * 5); ctx.lineTo(s.x, s.y + s.r * 5);
          ctx.stroke();
          if (s.r > 2) {
            ctx.beginPath();
            ctx.moveTo(s.x - s.r * 4, s.y - s.r * 4); ctx.lineTo(s.x + s.r * 4, s.y + s.r * 4);
            ctx.moveTo(s.x + s.r * 4, s.y - s.r * 4); ctx.lineTo(s.x - s.r * 4, s.y + s.r * 4);
            ctx.stroke();
          }
        }
      }

      // particles
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -60) p.x = w + 60; if (p.x > w + 60) p.x = -60;
        if (p.y < -60) p.y = h + 60; if (p.y > h + 60) p.y = -60;
        const pulse = Math.sin(time * p.pulseSpeed * 45 + p.phase);
        const sz = p.size * (0.85 + 0.15 * pulse);
        const outerR = sz * 7, midR = sz * 2.5, coreR = sz * 0.25;

        // outer glow
        const gOut = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, outerR);
        gOut.addColorStop(0, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.5)`);
        gOut.addColorStop(0.5, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.05)`);
        gOut.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(p.x, p.y, outerR, 0, Math.PI * 2);
        ctx.fillStyle = gOut; ctx.fill();

        // mid glow
        const gMid = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, midR);
        gMid.addColorStop(0, "rgba(255,255,255,0.7)");
        gMid.addColorStop(0.5, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.3)`);
        gMid.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(p.x, p.y, midR, 0, Math.PI * 2);
        ctx.fillStyle = gMid; ctx.fill();

        // core white point
        ctx.beginPath(); ctx.arc(p.x, p.y, coreR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
      }

      // meteors
      meteorTimer += 16;
      if (meteors.length < 4 && meteorTimer > (4000 + Math.random() * 6000)) {
        meteorTimer = 0;
        meteors.push(spawnMeteor(w, h));
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx; m.y += m.vy;
        m.life += 16;
        if (m.life > m.maxLife) { meteors.splice(i, 1); continue; }
        const fade = m.life < 300 ? m.life / 300 : m.life > m.maxLife - 300 ? (m.maxLife - m.life) / 300 : 1;
        // trailing gradient
        const dx = -m.vx / Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        const dy = -m.vy / Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        const tailX = m.x + dx * m.length;
        const tailY = m.y + dy * m.length;
        const g = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        g.addColorStop(0, `rgba(${m.color[0]},${m.color[1]},${m.color[2]},${fade * 0.8})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = g;
        ctx.stroke();
        // head glow
        const headG = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 8);
        headG.addColorStop(0, `rgba(255,255,255,${fade})`);
        headG.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = headG; ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    if (prefersReducedMotion) {
      // Static render: draw once without animation loop
      draw(performance.now());
    } else {
      rafId = requestAnimationFrame(draw);
    }

    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}
