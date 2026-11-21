/* =============================================
   MineCalc UA — відкладене завантаження важких вбудувань (ЛР №12)
   1) «Фасади» для Google Maps і YouTube: iframe створюється лише після натискання.
   2) Скрипт <model-viewer> підключається, коли 3D-модель наближається до екрана.
   ============================================= */

(function () {
  "use strict";

  // ---------- 1. Фасади iframe ----------
  document.querySelectorAll("[data-embed]").forEach((button) => {
    button.addEventListener("click", () => {
      const box = button.closest("[data-embed-box]");
      if (!box) return;

      const iframe = document.createElement("iframe");
      iframe.src = button.dataset.embed;
      iframe.title = button.dataset.embedTitle || "Вбудований вміст";
      iframe.className = "h-full w-full";
      iframe.style.border = "0";
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

      box.replaceChildren(iframe);
      iframe.focus(); // фокус не губиться після заміни кнопки на плеєр/карту
    }, { once: true });
  });

  // ---------- 2. Ліниве підключення model-viewer ----------
  const model = document.querySelector("model-viewer");
  if (!model) return;

  let loaded = false;
  function loadModelViewer() {
    if (loaded) return;
    loaded = true;
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    document.head.appendChild(script);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadModelViewer();
        observer.disconnect();
      }
    }, { rootMargin: "300px" }); // починаємо вантажити трохи заздалегідь
    observer.observe(model);
  } else {
    loadModelViewer(); // старі браузери — одразу
  }
})();
