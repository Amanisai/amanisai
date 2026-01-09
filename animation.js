(() => {
  console.log("animation.js loaded");

  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  onReady(() => {
    document.body.classList.add("dark-mode");

    const initApp = () => {
      /* ===============================
         TYPEWRITER (RESTORED)
      =============================== */
      const nameEl = document.getElementById("nameTyping");
      const roleEl = document.getElementById("typingText");

      if (nameEl && roleEl && !nameEl.dataset.typed) {
        nameEl.dataset.typed = "1";
        nameEl.textContent = "";
        roleEl.textContent = "";

        const nameText = "Amanisai Pokala";
        const roleText = "Web Developer";

        let ni = 0;
        let ri = 0;

        const typeName = () => {
          if (ni < nameText.length) {
            nameEl.textContent += nameText.charAt(ni++);
            setTimeout(typeName, 90);
          } else {
            setTimeout(typeRole, 350);
          }
        };

        const typeRole = () => {
          if (ri < roleText.length) {
            roleEl.textContent += roleText.charAt(ri++);
            setTimeout(typeRole, 110);
          }
        };

        typeName();
      }

      /* ===============================
         LIVE BACKGROUND
         Handled by p5.js in generative-bg.js
      =============================== */

      /* ===============================
         NAVBAR HIDE ON SCROLL
      =============================== */
      const navbarEl = document.querySelector(".navbar");
      if (navbarEl && !navbarEl.dataset.scrollHideHooked) {
        navbarEl.dataset.scrollHideHooked = "1";

        let lastY = window.scrollY || 0;
        let ticking = false;

        const update = () => {
          ticking = false;
          const y = window.scrollY || 0;
          const dy = y - lastY;

          // If mobile menu is open, keep it visible.
          const collapse = navbarEl.querySelector(".navbar-collapse");
          const menuOpen = collapse?.classList?.contains("show") ?? false;
          if (menuOpen) {
            navbarEl.classList.remove("nav-hidden");
            lastY = y;
            return;
          }

          // At top: always show.
          if (y < 16) {
            navbarEl.classList.remove("nav-hidden");
            lastY = y;
            return;
          }

          // Small dead-zone to avoid jitter.
          if (Math.abs(dy) > 6) {
            if (dy > 0) navbarEl.classList.add("nav-hidden");
            else navbarEl.classList.remove("nav-hidden");
            lastY = y;
          }
        };

        window.addEventListener(
          "scroll",
          () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
          },
          { passive: true }
        );
      }

      /* ===============================
         SCROLL PERFORMANCE MODE
         Temporarily disables expensive visual effects while actively scrolling.
      =============================== */
      if (!document.body.dataset.scrollPerfHooked) {
        document.body.dataset.scrollPerfHooked = "1";
        let scrollPerfTimer = 0;
        window.addEventListener(
          "scroll",
          () => {
            if (!document.body.classList.contains("is-scrolling")) {
              document.body.classList.add("is-scrolling");
            }
            if (scrollPerfTimer) window.clearTimeout(scrollPerfTimer);
            scrollPerfTimer = window.setTimeout(() => {
              document.body.classList.remove("is-scrolling");
            }, 160);
          },
          { passive: true }
        );
      }
    };

    initApp();
  });
})();

