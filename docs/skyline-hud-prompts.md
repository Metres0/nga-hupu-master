## 小米 YU7 天际屏 — 全景显示系统
### 前端页面完整提示词

---

### 一、视觉风格 (Visual Style)

```
Panoramic windshield HUD display, dark glass cockpit dashboard, cyan-blue
ambient glow, deep navy background (#0a1428), material design 3 surface
hierarchy, glassmorphism overlay cards with backdrop-blur, radial gradient
light halos, anti-reflection SCE coating aesthetic, floating holographic
numerals with text-shadow glow, blind-spot camera overlay, scene-adaptive
information layout switching between straight-drive and turning modes.

Canonical color palette:
  Background:  #0a1428 (dark navy surface)
  Surface low: #050a16, Surface high: #162540
  Primary:     #7eb8ff (sky blue)
  Secondary:   #6bd4f0 (cyan)
  Tertiary:    #8ed8e0 (teal)
  Text:        #e2eaf5 (primary), #a8bbd8 (secondary), #5a7298 (tertiary)
  Glass:       rgba(20,30,55,0.40) with blur(20px) saturate(150%)
  Glow:        0 0 14px rgba(126,184,255,0.3)

Typography: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei
  Display: 30px/700, Headline: 24px/600, Body: 14px/400
  HUD numerals: font-black, tracking-tight, text-shadow glow
```

---

### 二、星空粒子背景 (Starry Background)

```
Canvas full-viewport fixed background, z-index 0, pointer-events none.

Star layer (300 elements):
  - Random positions across viewport, radius 0.3-2.5px
  - Each star has independent HSLA hue (200-260 range: cyan to purple)
  - Twinkling: opacity = baseAlpha * (0.2 + 0.8 * sin(time * speed * 45 + phase))
  - Radial gradient glow: radius * 4 with hsla(hue, 80%, 75%, alpha * 0.3)
  - Large stars (r > 1): cross-shaped light rays + diagonal rays for r > 1.6
  - Ray stroke: hsla(hue, 50%, 85%, alpha * 0.25), lineWidth 0.4-0.7

Floating light particles (40 elements):
  - 3 tiers by size: large 30% (8-20px), medium 25% (4-10px), small 30% (1.5-4.5px)
  - Large particles move slower (0.1-0.4 px/frame), small faster (0.2-0.9)
  - 12-color palette: cyan(64,224,255), indigo(138,180,248), purple(167,139,250),
    teal(45,212,191), magenta(232,121,249), sky(56,189,248) etc.
  - 3-layer radial glow:
    Outer: size * 7, color 0.5 alpha at center fading to 0.05 at 50%, transparent edge
    Mid:   size * 2.5, white 0.7 alpha at core -> color transition -> transparent
    Core:  size * 0.25, white 0.95 alpha, sharp bright point
  - Pulse: size * (0.85 + 0.15 * sin(time * pulseSpeed * 45 + phase))
  - Screen edge wrap-around with 60px buffer

Nebula layers (3 overlapping):
  1. Radial gradient at (25%, 30%): cyan→indigo→purple→teal→transparent
  2. Radial gradient at (70%, 55%): purple→cyan→purple→transparent
  3. Linear diagonal gradient (0,0→100%,100%): transparent→cyan→indigo→purple→transparent

Shooting meteors (up to 4 simultaneous):
  - Spawn randomly every 4-10 seconds
  - Direction: angle from top-left toward bottom-right (vx 3-8, vy 1-4)
  - Length: 40-120px trailing gradient
  - Lifecycle: 2-5 seconds with fade-in/fade-out envelope
  - Head: 8px radial white glow
  - Colors: white, light blue, light cyan
```

---

### 三、文字逐行浮现 (Text Entrance Animation)

```
Component: LyricsLine (from LyricsAnimation.tsx)

Per-character cascade:
  - Each character renders as an <span> with individual CSS transition delay
  - Interval: 80ms per character + 30ms per-char CSS delay
  - Initial state:  opacity 0.15, filter blur(6px),
                    transform translateY(10px) scale(0.9)
  - Final state:    opacity 1, filter blur(0px),
                    transform translateY(0) scale(1)
  - Transition:     0.5s cubic-bezier(0.05, 0.7, 0.1, 1)
  - Color:          rgb(128, 222, 234) for active
  - Glow:           text-shadow 0 0 10px/30px with rgba(128,222,234,0.5/0.25)
  - Trigger:        IntersectionObserver at 0.3 threshold

3D depth group (LyricsGroup wrapper, perspective: 800px):
  - Active line:   translateZ(40px) scale(1.05)
  - Inactive line: opacity = max(0.25, 1 - distance * 0.35)
                   blur = min(4px, distance * 1.5px)
                   translateZ(-distance * 20px) scale(1 - distance * 0.05)

Color palette:
  - cyan:   #80deea  glow rgba(128,222,234,*)  core #e0f7fa
  - white:  #e2e2e9  glow rgba(226,226,233,*)  core #ffffff
  - magenta:#f48fb1  glow rgba(244,143,177,*)  core #fce4ec
```

---

### 四、3D 透视交互 (3D Perspective)

```
Component: Float3D (mouse parallax container)

  const mv = (e) => {
    const r = el.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;  // -1 to 1
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;   // -1 to 1
  };

  Lerp smoothing:
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;

  Transform:
    el.style.transform =
      `perspective(1000px) rotateY(${cx * 5}deg) rotateX(${-cy * 3}deg)`;

  CSS container: transform-style: preserve-3d

Usage pattern:
  <Float3D>
    <div className="glass-card-elevated">
      {/* content with nested LyricsLine for text entrance */}
    </div>
  </Float3D>
```

---

### 五、HUD 数字辉光 (GlowNum)

```
Component: GlowNum({ value, size })

  Font:   font-black tracking-tight
  Color:  var(--text-primary)
  Glow:   text-shadow: 0 0 14px rgba(126,184,255,0.3)

  Sizes:  sm = text-xl, md = text-3xl, lg = text-6xl

Usage:   <GlowNum value="120" size="lg"/>
         <span className="text-[10px] text-[var(--text-tertiary)] ml-1">km/h</span>
```

---

### 六、903 分区控光 Canvas (Zone Grid)

```
Canvas rendering: 33 columns x 28 rows = 924 cells (包含冗余)
  - Cell size: 10px, gap: 1px, DPR: 2x
  - Pixelated rendering: imageRendering: "pixelated"

Brightness formula per cell:
  wave1 = sin(time + col*x1 + row*x2)  * 0.5 + 0.5  → weight 0.30
  wave2 = sin(time * 0.7 + col*x3 - row*x4) * 0.5 + 0.5  → weight 0.25
  wave3 = sin(time * 1.3 - col*x5 + row*x6) * 0.5 + 0.5  → weight 0.15
  center = max(0, 1 - sqrt((col-0.5)^2 + (row-0.5)^2) * 1.6) → weight 0.30
  brightness = clamp(wave1*0.3 + wave2*0.25 + wave3*0.15 + center*0.3, 0, 1)

Color mapping (5-tier gradient):
  level 0: (126,184,255)  level 1: (107,212,240)  level 2: (162,216,224)
  level 3: (107,150,240)  level 4: (80,180,220)

Per-cell RGB:
  R = 3 + color.R * brightness * 0.35
  G = 6 + color.G * brightness * 0.30
  B = 14 + color.B * brightness * 0.40

Vignette overlay:
  radial-gradient(ellipse at center, transparent 20%, surface-lowest 100%)
```

---

### 七、玻璃态卡片系统 (Glass Cards)

```
CSS classes from globals.css Skyline Theme:

.glass-card:
  background: var(--glass-bg-light)         (rgba(20,30,55,0.40) dark)
  backdrop-filter: blur(20px) saturate(150%)
  border: 1px solid rgba(255,255,255,0.50)
  border-top: rgba(255,255,255,0.75)
  border-radius: 22px
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.65),
              inset 0 -1px 0 rgba(255,255,255,0.15),
              var(--shadow-card)

[data-theme="dark"] .glass-card:
  border: rgba(100,160,220,0.15)
  border-top: rgba(100,160,220,0.25)
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08),
              inset 0 -1px 0 rgba(255,255,255,0.03),
              var(--shadow-card)

.glass-card-elevated:
  Same as glass-card but:
    background: rgba(255,255,255,0.48) light / rgba(25,38,65,0.55) dark
    blur: 28px saturate(150%), border-radius: 28px
    box-shadow: var(--shadow-elevated) with stronger inset highlights

Usage:
  <div className="glass-card p-4"> content </div>
  <div className="glass-card-elevated p-8"> hero content </div>
```

---

### 八、CSS 变量主题系统 (Theme Variables)

```
Core surface hierarchy (dark mode):
  --md-surface:                      #0a1428
  --md-surface-container-lowest:     #050a16
  --md-surface-container-low:        #0a1428
  --md-surface-container:            #0e1a32
  --md-surface-container-high:       #162540
  --md-surface-container-highest:    #1d2e4d

Text colors (dark mode):
  --text-primary:    #e2eaf5
  --text-secondary:  #a8bbd8
  --text-tertiary:   #5a7298

Accent (dark mode):
  --md-primary:             #7eb8ff
  --md-primary-container:  #1a3a6b
  --md-on-primary-container: #d6e8ff
  --md-secondary:           #6bd4f0
  --md-tertiary:            #8ed8e0
  --md-outline-variant:     #1d3050
  --md-outline-subtle:      rgba(126,184,255,0.08)

Usage in inline styles:
  background: "var(--md-surface-container-lowest)"
  color: "var(--text-primary)"
  borderColor: "var(--md-outline-variant)"
```

---

### 九、全景 HUD 场景 (Scene-adaptive Layout)

```
Three modes: straight | turn-left | turn-right

Straight mode (5-column grid):
  [Media] [Range 680km] [Speed 120km/h] [Navi 500m] [ADAS Active]
  Speed uses GlowNum size="lg" (text-6xl, font-black)

Turn modes (3-column grid):
  Left turn:  [Left Blind Camera]  [Speed 45km/h]  [Navi L 200m]
  Right turn: [Navi R 200m]        [Speed 45km/h]  [Right Blind Camera]

Container:
  aspect-ratio: 21/9, min-height: 210px
  background: surface-container-lowest
  border: 1px solid outline-variant
  Inner radial glow: at 50% 100% (bottom center), sky tint 5%

Top bar:
  Left:  pulsing dot + "Sky Screen" label
  Right: Drive / Left / Right toggle buttons
  Active button: primary-container background + on-primary-container text
```

---

### 十、页面布局结构 (Page Layout)

```
Page
├── EnhancedStarryBg (canvas, fixed inset-0, z-0)
├── Content (max-w-4xl mx-auto, z-10)
│   ├── Hero (glass-card-elevated, Float3D wrapper)
│   │   ├── LyricsLine x3 (title cascade, color=cyan)
│   │   ├── LyricsLine x2 (description, color=white)
│   │   ├── Info box (surface-container-lowest, subtle border)
│   │   └── Tags (primary-container background, rounded-full)
│   │
│   ├── Core Parameters (2x5 grid)
│   │   └── Per card: glass-card, uppercase label, bold value
│   │       Highlighted cards: primary border tint + primary text color
│   │
│   ├── Optical Path (glass-card + SVG animation)
│   │   └── 4-step state machine, SVG path animations with linearGradient
│   │
│   ├── HUD Scene (Float3D wrapper)
│   │   └── Scene-adaptive layout with 3 modes
│   │
│   ├── Zone Grid (glass-card + Canvas)
│   │   └── Real-time brightness wave simulation
│   │
│   ├── Distortion & Ghosting (2-column, glass-card)
│   │   ├── Freeform distortion grid visualization
│   │   └── Wedge PVB zero-ghosting SVG diagram
│   │
│   ├── Six Core Technologies (2-column grid)
│   │   └── Numbered cards with title + description
│   │
│   └── Key Prompts (glass-card, monospace)
│       └── Visual / 3D / CSS / Integration sections
```

---

### 十一、关键 CSS 属性汇总

```css
/* 3D 透视 */
perspective: 1000px;                              /* 容器 */
transform-style: preserve-3d;                     /* 继承 */
transform: rotateY(Xdeg) rotateX(Ydeg);           /* 鼠标视差 */

/* 玻璃态 */
backdrop-filter: blur(20px) saturate(150%);       /* 核心 */
-webkit-backdrop-filter: blur(20px) saturate(150%);

/* 辉光文字 */
text-shadow:
  0 0 10px rgba(128,222,234,0.5),                /* 内层辉光 */
  0 0 30px rgba(128,222,234,0.25);               /* 外层辉光 */

/* 渐隐过渡 (逐字浮现) */
transition: all 0.5s cubic-bezier(0.05,0.7,0.1,1);
transition-delay: calc(var(--index, 0) * 30ms);

/* Canvas 高性能渲染 */
image-rendering: pixelated;
aspect-ratio: 33/28;

/* 径向渐变光晕 */
radial-gradient(
  ellipse at 50% 100%,                            /* 底部中心 */
  rgba(126,184,255,0.05) 0%,                      /* 光源 */
  transparent 50%                                  /* 衰减 */
);

/* requestAnimationFrame 主循环 */
function draw() {
  // ... update state ...
  requestAnimationFrame(draw);
}
```

---

### 十二、Canvas 粒子系统架构

```
EnhancedStarryBg (300 stars + 40 particles + meteors + 3 nebula):

  useEffect(() => {
    // 1. 初始化 Canvas 上下文 + DPR (max 2x)
    // 2. 生成星空数据 (initStars/initPar)
    // 3. 启动 requestAnimationFrame 绘制循环
    // 4. 注册 resize 事件处理
    // 5. 清理: cancelAnimationFrame + removeEventListener
  }, []);

  draw() 每帧执行:
    clearRect() → 3层星云 fill → 300星 (辉光+十字光芒) →
    40粒子 (3层径向辉光+核心白点) → 流星 (渐变拖尾+头部辉光) →
    requestAnimationFrame(draw)

  resize():
    更新 canvas.width/height = innerWidth/Height * dpr
    重新生成所有星星和粒子位置
```

---

### 十三、核心依赖

| 技术 | 用途 |
|------|------|
| `Next.js 14 App Router` | 页面路由 + SSR |
| `React 18` | `useState`/`useEffect`/`useRef` |
| `Canvas 2D API` | 星空背景 + 分区控光渲染 |
| `requestAnimationFrame` | 所有动画循环 |
| `SVG (inline)` | 光学路径图 + 零重影原理图 |
| `CSS Custom Properties` | 主题变量系统 |
| `Tailwind CSS 3` | 布局 + 工具类 + glass-card |
| `LyricsLine` (项目组件) | 逐字浮现 |
| `glass-card` / `glass-card-elevated` | 玻璃态卡片 |
