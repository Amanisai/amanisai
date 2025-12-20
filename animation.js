console.log("animations.js loaded");
document.body.classList.add("dark-mode");


/* ==================================================
   SCROLL PROGRESS BAR
================================================== */
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
  const scrollTop = document.documentElement.scrollTop;
  const scrollHeight =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  progressBar.style.width = (scrollTop / scrollHeight) * 100 + "%";
});

/* ==================================================
   SCROLL REVEAL (SECTIONS)
================================================== */
const sections = document.querySelectorAll(
  "#aboutMeSection, #educationSection, #skillsSection, #projectSection, #internshipSection, #contactSection"
);

sections.forEach((sec) => {
  sec.style.opacity = "0";
  sec.style.transform = "translateY(40px)";
  sec.style.transition = "all 0.9s ease";
});

const revealOnScroll = () => {
  const windowHeight = window.innerHeight;
  sections.forEach((sec) => {
    if (sec.getBoundingClientRect().top < windowHeight - 120) {
      sec.style.opacity = "1";
      sec.style.transform = "translateY(0)";
    }
  });
};

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();

/* ==================================================
   TYPEWRITER EFFECT (HERO)
================================================== */
document.querySelectorAll(".focus-text").forEach((el) => {
  const text = el.innerText;
  el.innerText = "";
  let i = 0;

  const type = () => {
    if (i < text.length) {
      el.innerText += text.charAt(i);
      i++;
      setTimeout(type, 80);
    }
  };
  setTimeout(type, 600);
});

/* ==================================================
   BUTTON HOVER PULSE
================================================== */
document.querySelectorAll(
  ".heroButtons, .gitHubButton, .demoButton, .certificateBtn"
).forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "scale(1.06)";
    btn.style.transition = "0.2s ease";
  });

  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "scale(1)";
  });
});

/* ==================================================
   INTERNSHIP CARD REVEAL
================================================== */
const internCards = document.querySelectorAll(".internshipCard");

internCards.forEach((card, i) => {
  card.style.opacity = "0";
  card.style.transform = "translateY(30px)";
  card.style.transition = `all 0.6s ease ${i * 0.15}s`;
});

const revealInternships = () => {
  const windowHeight = window.innerHeight;
  internCards.forEach((card) => {
    if (card.getBoundingClientRect().top < windowHeight - 100) {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }
  });
};

window.addEventListener("scroll", revealInternships);
revealInternships();

/* ==================================================
   DARK MODE TOGGLE (SAFE)
================================================== */
/* ===============================
   DARK MODE TOGGLE (PROPER)
================================ */

const toggle = document.createElement("button");
toggle.innerText = "🌙";
toggle.style.position = "fixed";
toggle.style.bottom = "25px";
toggle.style.right = "25px";
toggle.style.border = "none";
toggle.style.borderRadius = "50%";
toggle.style.width = "50px";
toggle.style.height = "50px";
toggle.style.background = "#000";
toggle.style.color = "#fff";
toggle.style.cursor = "pointer";
toggle.style.zIndex = "9999";
toggle.style.fontSize = "18px";

document.body.appendChild(toggle);

toggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  toggle.innerText = document.body.classList.contains("dark-mode")
    ? "☀️"
    : "🌙";
});

const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const dots = Array.from({ length: 90 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 2 + 1,
  dx: (Math.random() - 0.5) * 0.6,
  dy: (Math.random() - 0.5) * 0.6
}));

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dots.forEach(d => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains("dark-mode")
      ? "rgba(22, 196, 155, 0.6)"
      : "rgba(163, 249, 238, 0.87)";
    ctx.fill();

    d.x += d.dx;
    d.y += d.dy;

    if (d.x < 0 || d.x > canvas.width) d.dx *= -1;
    if (d.y < 0 || d.y > canvas.height) d.dy *= -1;
  });

  requestAnimationFrame(draw);
}

draw();
const cursor = document.createElement("div");
cursor.classList.add("custom-cursor");
document.body.appendChild(cursor);

document.addEventListener("mousemove", e => {
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});
