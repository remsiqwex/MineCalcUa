/* =============================================
   MineCalc UA — ініціалізація сторонніх плагінів (ЛР №10)
   Swiper.js v11, Fancybox v5, Typed.js — Vanilla JS, без jQuery.
   ============================================= */

/* ЛР №12: бібліотеки потрібні нижче першого екрана, тому вантажимо їх після події load —
   вони більше не конкурують за мережу з LCP-зображенням hero. */
const PLUGIN_CSS = [
  "https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.css",
  "https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0.36/dist/fancybox/fancybox.css",
];
const PLUGIN_JS = [
  "https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.js",
  "https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0.36/dist/fancybox/fancybox.umd.js",
  "https://cdn.jsdelivr.net/npm/typed.js@2.0.12/lib/typed.min.js",
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadPlugins() {
  PLUGIN_CSS.forEach((href) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });
  Promise.allSettled(PLUGIN_JS.map(loadScript)).then(initPlugins);
}

if (document.readyState === "complete") loadPlugins();
else window.addEventListener("load", loadPlugins, { once: true });

function initPlugins() {
  // Якщо користувач вимкнув анімації в системі, не запускаємо автопрокрутку та ефект друку
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- 1. Swiper: слайдер відгуків ----------
  if (typeof Swiper !== "undefined") {
    new Swiper(".reviews-swiper", {
      loop: true,              // після останнього слайда — знову перший
      spaceBetween: 30,        // відстань між картками, px
      speed: 600,              // тривалість анімації переходу, мс
      grabCursor: true,        // курсор-«рука» підказує, що можна тягнути
      autoplay: reduceMotion ? false : {
        delay: 3500,           // пауза між перемиканнями, мс
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: ".reviews-swiper .swiper-pagination",
        clickable: true,
      },
      navigation: {
        prevEl: ".reviews-prev",
        nextEl: ".reviews-next",
      },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: {
        prevSlideMessage: "Попередній відгук",
        nextSlideMessage: "Наступний відгук",
        paginationBulletMessage: "Перейти до відгуку {{index}}",
      },
      // Адаптивність: скільки карток видно на різній ширині екрана
      breakpoints: {
        320: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
    });
  } else {
    console.warn("Swiper не завантажився з CDN");
  }

  // ---------- 2. Fancybox: галерея «Натхнення для будівель» ----------
  if (typeof Fancybox !== "undefined") {
    Fancybox.bind("[data-fancybox='builds']", {
      Carousel: { transition: "fade" },      // плавна зміна фото
      Images: { Panzoom: { maxScale: 3 } },  // зум до 300 %
      Thumbs: { type: "classic" },           // мініатюри знизу
      l10n: {
        CLOSE: "Закрити",
        NEXT: "Далі",
        PREV: "Назад",
        TOGGLE_ZOOM: "Збільшити",
        TOGGLE_THUMBS: "Мініатюри",
        TOGGLE_SLIDESHOW: "Слайдшоу",
        TOGGLE_FULLSCREEN: "На весь екран",
        DOWNLOAD: "Завантажити",
      },
    });
  } else {
    console.warn("Fancybox не завантажився з CDN");
  }

  // ---------- 3. Typed.js: ефект друку в головному заголовку ----------
  if (typeof Typed !== "undefined" && !reduceMotion && document.querySelector("#typed-text")) {
    new Typed("#typed-text", {
      strings: ["українською", "для Java та Bedrock", "без реклами", "для твоїх будівель"],
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 1800,
      loop: true,
    });
  }
}
