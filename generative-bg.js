(() => {
	"use strict";

	const reduceMotion =
		window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

	const container = document.getElementById("bg-canvas");
	if (!container) return;

	const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
	const rand = (a, b) => a + Math.random() * (b - a);

	const sketch = (p) => {
		const palette = {
			blue: [80, 190, 255],
			purple: [176, 120, 255],
			white: [255, 255, 255],
		};

		const state = {
			particles: [],
			w: 0,
			h: 0,
			last: 0,
			sprites: null,
			scrollingUntil: 0,
		};

		const particleCountFor = (w, h) => {
			const area = w * h;
			// Slightly denser for better visibility (kept capped for performance)
			return clamp(Math.round(area / 105000), 18, 32);
		};

		const chooseColor = (z) => {
			// Slight bias to cooler tones in the distance.
			return z < 0.55 ? palette.blue : palette.purple;
		};

		const makeBokehSprite = (size, rgb) => {
			const s = document.createElement("canvas");
			s.width = size;
			s.height = size;
			const c = s.getContext("2d");
			const r = size / 2;

			const g = c.createRadialGradient(r, r, 0, r, r, r);
			g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`);
			g.addColorStop(0.25, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35)`);
			g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);

			c.fillStyle = g;
			c.beginPath();
			c.arc(r, r, r, 0, Math.PI * 2);
			c.fill();

			// Gentle bloom baked in
			c.filter = "blur(2px)";
			c.globalAlpha = 0.55;
			c.drawImage(s, 0, 0);
			c.filter = "none";
			c.globalAlpha = 1;

			// Subtle highlight
			c.fillStyle = "rgba(255,255,255,0.22)";
			c.beginPath();
			c.arc(r - r * 0.22, r - r * 0.22, Math.max(2, r * 0.05), 0, Math.PI * 2);
			c.fill();

			return s;
		};

		const createParticle = (w, h) => {
			const z = Math.random(); // depth: 0 (far) -> 1 (near)
			const baseR = rand(70, 220);
			const r = baseR * (0.55 + 0.85 * z);

			// Time-based drift only (NOT mouse-reactive)
			const speed = (0.10 + 0.28 * z) * 60;
			const angle = rand(0, Math.PI * 2);

			const col = chooseColor(z);

			// More visible + glowy, but still recruiter-friendly.
			const a = 0.055 + 0.090 * z;
			const core = 0.042 + 0.070 * z;

			return {
				x: Math.random() * w,
				y: Math.random() * h,
				z,
				r,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				col,
				a,
				core,
			};
		};

		const rebuild = () => {
			state.w = Math.max(1, container.clientWidth || window.innerWidth);
			state.h = Math.max(1, container.clientHeight || window.innerHeight);

			p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
			p.resizeCanvas(state.w, state.h);

			const count = particleCountFor(state.w, state.h);
			state.particles = Array.from({ length: count }, () =>
				createParticle(state.w, state.h)
			);
		};

		const drawParticle = (pt, lite) => {
			const x = pt.x;
			const y = pt.y;
			const r = pt.r;

			const ctx = p.drawingContext;
			const sprite = pt.col === palette.blue ? state.sprites.blue : state.sprites.purple;

			// Base bokeh
			ctx.globalCompositeOperation = "source-over";
			ctx.globalAlpha = pt.a;
			ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);

			if (lite) return;

			// Core glow pass (additive)
			ctx.globalCompositeOperation = "lighter";
			ctx.globalAlpha = pt.core;
			const cr = r * 0.75;
			ctx.drawImage(sprite, x - cr, y - cr, cr * 2, cr * 2);

			// Wider bloom (very soft, low alpha)
			ctx.globalAlpha = pt.core * 0.35;
			const br = r * 1.25;
			ctx.drawImage(sprite, x - br, y - br, br * 2, br * 2);

			// tiny extra white glint (depth cue)
			ctx.globalAlpha = 0.07 + 0.12 * pt.z;
			ctx.drawImage(state.sprites.glint, x - r * 0.55, y - r * 0.55, r * 0.35, r * 0.35);
		};

		p.setup = () => {
			const c = p.createCanvas(1, 1);
			c.parent(container);

			// Ensure canvas does not block interaction.
			c.elt.style.pointerEvents = "none";

			// Slightly lower FPS helps keep scrolling smooth on mid-range devices.
			p.frameRate(40);
			p.noStroke();

			state.last = p.millis();

			// Cache sprites once (big win for performance)
			if (!state.sprites) {
				state.sprites = {
					blue: makeBokehSprite(256, palette.blue),
					purple: makeBokehSprite(256, palette.purple),
					glint: makeBokehSprite(128, palette.white),
				};
			}
			window.addEventListener("resize", rebuild, { passive: true });
			// Freeze the background while scrolling to keep scrolling buttery-smooth.
			let resumeTimer = 0;
			window.addEventListener(
				"scroll",
				() => {
					if (reduceMotion) return;
					state.scrollingUntil = performance.now() + 220;
					p.noLoop();
					if (resumeTimer) window.clearTimeout(resumeTimer);
					resumeTimer = window.setTimeout(() => {
						if (!document.hidden) p.loop();
					}, 200);
				},
				{ passive: true }
			);
			document.addEventListener("visibilitychange", () => {
				if (reduceMotion) return;
				if (document.hidden) p.noLoop();
				else p.loop();
			});

			rebuild();

			// Respect reduced motion.
			if (reduceMotion) {
				p.noLoop();
				p.redraw();
			}
		};

		p.draw = () => {
			const now = p.millis();
			const dt = Math.min(0.05, (now - state.last) / 1000);
			state.last = now;

			// Transparent canvas; body handles base background.
			p.clear();

			const isScrolling = performance.now() < state.scrollingUntil;
			const margin = 260;
			for (let i = 0; i < state.particles.length; i++) {
				if (isScrolling && (i % 2 === 1)) continue;
				const pt = state.particles[i];
				pt.x += pt.vx * dt * (0.25 + 0.55 * (1 - pt.z));
				pt.y += pt.vy * dt * (0.25 + 0.55 * (1 - pt.z));

				// Wrap-around
				if (pt.x < -margin) pt.x = state.w + margin;
				if (pt.x > state.w + margin) pt.x = -margin;
				if (pt.y < -margin) pt.y = state.h + margin;
				if (pt.y > state.h + margin) pt.y = -margin;

				drawParticle(pt, isScrolling);
			}

			p.drawingContext.globalAlpha = 1;
		};
	};

	// Instance mode so we don't pollute globals.
	// eslint-disable-next-line no-new
	new window.p5(sketch);
})();