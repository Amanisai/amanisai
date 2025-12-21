console.log("animations.js loaded");

/* FORCE DARK MODE */
document.body.classList.add("dark-mode");


/* ===============================
   TYPEWRITER EFFECT
=============================== */

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("nameTyping");
  const roleEl = document.getElementById("typingText");

  const nameText = "Amanisai Pokala";
  const roleText = "Web Developer";

  let nameIndex = 0;
  let roleIndex = 0;

  function typeName() {
    if (nameIndex < nameText.length) {
      nameEl.textContent += nameText.charAt(nameIndex);
      nameIndex++;
      setTimeout(typeName, 100);
    } else {
      setTimeout(typeRole, 500); // pause before role
    }
  }

  function typeRole() {
    if (roleIndex < roleText.length) {
      roleEl.textContent += roleText.charAt(roleIndex);
      roleIndex++;
      setTimeout(typeRole, 120);
    }
  }

  typeName();
});;


/* ===============================
   CANVAS SETUP (MISSING PART)
=============================== */
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ===============================
   SCROLL PROGRESS BAR
=============================== */
const progressBar = document.createElement("div");
progressBar.style.position = "fixed";
progressBar.style.top = "0";
progressBar.style.left = "0";
progressBar.style.height = "4px";
progressBar.style.width = "0%";
progressBar.style.background = "#0177B4";
progressBar.style.zIndex = "9999";
document.body.appendChild(progressBar);

window.addEventListener("scroll", () => {
  const st = document.documentElement.scrollTop;
  const sh =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  progressBar.style.width = (st / sh) * 100 + "%";
});

/* ===============================
   TRIANGLE CURSOR
=============================== */
const cursor = document.createElement("div");
cursor.className = "triangle-cursor";
document.body.appendChild(cursor);

let mouseX = w / 2;
let mouseY = h / 2;

document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + "px";
  cursor.style.top = mouseY + "px";
});

/* ===============================
   PARTICLE CONFIG
=============================== */
const PARTICLES = 90;
const CONNECT_DIST = 130;
const MAGNET_RADIUS = 180;
const MAGNET_FORCE = 0.08;
const RETURN_FORCE = 0.03;

const mouse = { x: null, y: null };

document.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
document.addEventListener("mouseleave", () => {
  mouse.x = mouse.y = null;
});

/* ===============================
   CREATE PARTICLES (FIXED)
=============================== */
const particles = Array.from({ length: PARTICLES }, () => {
  const ox = Math.random() * w;
  const oy = Math.random() * h;
  return {
    x: ox,
    y: oy,
    ox,
    oy,
    r: Math.random() * 1.6 + 0.8
  };
});

/* ===============================
   ANIMATION LOOP
=============================== */
function animate() {
  ctx.clearRect(0, 0, w, h);

  // update positions
  for (const p of particles) {
    p.x += (p.ox - p.x) * RETURN_FORCE;
    p.y += (p.oy - p.y) * RETURN_FORCE;

    if (mouse.x !== null) {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MAGNET_RADIUS) {
        const force = (1 - dist / MAGNET_RADIUS) * MAGNET_FORCE;
        p.x -= dx * force;
        p.y -= dy * force;
      }
    }
  }

  // draw lines
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < CONNECT_DIST) {
        ctx.strokeStyle = `rgba(77,208,225,${1 - d / CONNECT_DIST})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  // draw particles
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(77,208,225,0.9)";
    ctx.shadowColor = "rgba(77,208,225,0.8)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  requestAnimationFrame(animate);
}

animate();
