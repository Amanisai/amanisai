(() => {
  "use strict";

  /**
   * Premium particle cursor (smoke/ink + sparks).
   * - No external libs
   * - Additive blending (cinematic glow)
   * - Trailing effect via canvas alpha fade (no hard clears)
   * - Emission scales with mouse speed
   * - Disabled on mobile / coarse pointers
   */

  const finePointer =
    window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;
  const reduceMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  if (!finePointer || reduceMotion) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  let canvas = document.getElementById("cursor-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    canvas = document.createElement("canvas");
    canvas.id = "cursor-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  let dpr = 1;
  let w = 1;
  let h = 1;

  // Mouse state
  const mouse = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    px: window.innerWidth * 0.5,
    py: window.innerHeight * 0.5,
    vx: 0,
    vy: 0,
    speed: 0,
    lastT: performance.now(),
    inside: false,
  };

  // Pause emission on navbar hover (so nav feels normal)
  const navbar = document.querySelector(".navbar");
  if (navbar && !navbar.dataset.cursorParticlesHooked) {
    navbar.dataset.cursorParticlesHooked = "1";
    navbar.addEventListener(
      "mouseenter",
      () => document.body.classList.add("nav-hover"),
      { passive: true }
    );
    navbar.addEventListener(
      "mouseleave",
      () => document.body.classList.remove("nav-hover"),
      { passive: true }
    );
  }

  // --- Particle pool (fast, GC-friendly) ---
  const MAX = 650;
  const particles = new Array(MAX);
  let alive = 0;

  // Types: 0 = smoke, 1 = spark
  function spawn(type, x, y, baseVx, baseVy, intensity) {
    if (alive >= MAX) return;

    const p = particles[alive] || (particles[alive] = {});

    const ang = (Math.random() * Math.PI * 2) | 0;
    const jitter = 0.75 + Math.random() * 1.15;

    // Lifetimes tuned for premium feel
    const life = type === 0 ? 700 + Math.random() * 900 : 220 + Math.random() * 420;

    // Size: smoke is larger; spark is small/sharp
    const size0 = type === 0
      ? 18 + Math.random() * 34 + intensity * 18
      : 3 + Math.random() * 5 + intensity * 5;

    // Random velocity + inherit a bit of mouse velocity
    const vRand = type === 0 ? 22 : 80;
    const vx = baseVx * (type === 0 ? 0.18 : 0.26) + (Math.random() - 0.5) * vRand * jitter;
    const vy = baseVy * (type === 0 ? 0.18 : 0.26) + (Math.random() - 0.5) * vRand * jitter;

    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.ax = 0;
    p.ay = 0;
    p.type = type;
    p.life = life;
    p.age = 0;
    p.size = size0;
    p.size0 = size0;
    p.spin = (Math.random() - 0.5) * 0.8;
    p.seed = Math.random() * 1000;

    // Brightness & tint (white core, pink/purple edge)
    p.power = type === 0 ? (0.10 + 0.18 * intensity) : (0.24 + 0.50 * intensity);

    alive++;
  }

  function removeAt(i) {
    alive--;
    if (i !== alive) {
      const tmp = particles[i];
      particles[i] = particles[alive];
      particles[alive] = tmp;
    }
  }

  // --- Sprites (pre-rendered gradients for speed) ---
  function makeSprite(size, stops) {
    const s = document.createElement("canvas");
    s.width = size;
    s.height = size;
    const c = s.getContext("2d");

    const r = size / 2;
    const g = c.createRadialGradient(r, r, 0, r, r, r);
    for (const [t, col] of stops) g.addColorStop(t, col);

    c.fillStyle = g;
    c.beginPath();
    c.arc(r, r, r, 0, Math.PI * 2);
    c.fill();

    // A touch of blur baked into the sprite (cinematic softness)
    c.globalCompositeOperation = "source-over";
    c.filter = "blur(2.4px)";
    c.globalAlpha = 0.65;
    c.drawImage(s, 0, 0);
    // second pass for a smoother glow falloff
    c.globalAlpha = 0.35;
    c.drawImage(s, 0, 0);
    c.filter = "none";
    c.globalAlpha = 1;

    return s;
  }

  const smokeSprite = makeSprite(80, [
    [0.00, "rgba(255,255,255,0.55)"],
    [0.18, "rgba(255,210,235,0.22)"],
    [0.44, "rgba(210,160,255,0.09)"],
    [1.00, "rgba(0,0,0,0.00)"],
  ]);

  const sparkSprite = makeSprite(40, [
    [0.00, "rgba(255,255,255,0.95)"],
    [0.10, "rgba(255,210,235,0.55)"],
    [0.35, "rgba(200,140,255,0.16)"],
    [1.00, "rgba(0,0,0,0.00)"],
  ]);

  // --- Canvas sizing ---
  function resize() {
    // Cap DPR for performance (prevents background FPS drops)
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    w = Math.max(1, window.innerWidth | 0);
    h = Math.max(1, window.innerHeight | 0);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  // --- Mouse tracking ---
  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.inside = true;
    },
    { passive: true }
  );

  window.addEventListener(
    "mouseleave",
    () => {
      mouse.inside = false;
    },
    { passive: true }
  );

  // --- Animation loop ---
  let emitCarry = 0;

  function updateMouse(now) {
    const dt = Math.min(0.05, (now - mouse.lastT) / 1000);
    mouse.lastT = now;

    const dx = mouse.x - mouse.px;
    const dy = mouse.y - mouse.py;

    mouse.vx = dx / Math.max(1e-4, dt);
    mouse.vy = dy / Math.max(1e-4, dt);
    mouse.speed = Math.hypot(mouse.vx, mouse.vy);

    mouse.px = mouse.x;
    mouse.py = mouse.y;

    return dt;
  }

  function turbulence(x, y, t, seed) {
    // Cheap "noise-like" flow field (fast + organic enough).
    const s1 = Math.sin((x * 0.010 + t * 0.0012) + seed);
    const s2 = Math.sin((y * 0.012 - t * 0.0010) + seed * 1.7);
    const c1 = Math.cos((x * 0.008 - t * 0.0009) - seed * 0.4);
    const c2 = Math.cos((y * 0.009 + t * 0.0011) + seed * 2.1);
    return {
      fx: s1 + c2,
      fy: s2 + c1,
    };
  }

  function step(now) {
    const dt = updateMouse(now);

    // Fade the canvas by subtracting alpha (trail without dark overlay).
    ctx.globalCompositeOperation = "destination-out";
    // Slightly stronger fade reduces overdraw (still leaves smooth trails)
    ctx.fillStyle = "rgba(0,0,0,0.16)";
    ctx.fillRect(0, 0, w, h);

    // Draw particles additively for a premium glow.
    ctx.globalCompositeOperation = "lighter";

    const hoveringNav = document.body.classList.contains("nav-hover");

    // Emission: scales with speed; subtle when slow.
    if (mouse.inside && !hoveringNav) {
      const intensity = clamp(mouse.speed / 1600, 0, 1);

      // Rate: always a little smoke, more when faster.
      const targetRate = lerp(10, 85, intensity); // particles/sec (combined)
      emitCarry += targetRate * dt;

      const emitCount = Math.min(18, emitCarry | 0);
      if (emitCount > 0) emitCarry -= emitCount;

      for (let i = 0; i < emitCount; i++) {
        // Smoke dominates; sparks appear more with speed.
        spawn(0, mouse.x, mouse.y, mouse.vx, mouse.vy, intensity);
        if (Math.random() < 0.15 + 0.55 * intensity) {
          spawn(1, mouse.x, mouse.y, mouse.vx, mouse.vy, intensity);
        }
      }
    }

    // Update + render
    for (let i = 0; i < alive; i++) {
      const p = particles[i];
      p.age += dt * 1000;

      if (p.age >= p.life) {
        removeAt(i);
        i--;
        continue;
      }

      const t = p.age / p.life;
      const inv = 1 - t;

      // Flow field acceleration
      const flow = turbulence(p.x, p.y, now, p.seed);
      const turb = p.type === 0 ? 26 : 55;

      p.ax = flow.fx * turb;
      p.ay = flow.fy * turb;

      // Drag: sparks keep more energy, smoke slows faster
      const drag = p.type === 0 ? 0.86 : 0.90;

      p.vx = (p.vx + p.ax * dt) * drag;
      p.vy = (p.vy + p.ay * dt) * drag;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Soft expansion for smoke
      if (p.type === 0) {
        p.size = p.size0 * (1 + 0.55 * t);
      }

      // Alpha: smooth cinematic fade
      const alpha = p.type === 0
        ? (inv * inv) * p.power
        : (inv * inv * inv) * p.power;

      if (alpha < 0.004) continue;

      ctx.globalAlpha = alpha;

      const sprite = p.type === 0 ? smokeSprite : sparkSprite;
      const s = p.size;

      // Slight motion-stretch for sparks (cheap motion blur)
      if (p.type === 1) {
        const stretch = clamp(Math.hypot(p.vx, p.vy) / 1200, 0, 0.9);
        const sx = s * (1 + stretch * 1.4);
        const sy = s * (1 + stretch * 0.4);
        ctx.drawImage(sprite, p.x - sx * 0.5, p.y - sy * 0.5, sx, sy);
      } else {
        ctx.drawImage(sprite, p.x - s * 0.5, p.y - s * 0.5, s, s);
      }
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();
