/* =============================================
   MineCalc UA — віджет «Калькулятор ресурсів» (ЛР №11)
   Версія 2: Defensive Programming.
   Vanilla JS, без jQuery. Увесь код ізольовано в IIFE — жодних глобальних змінних.
   ============================================= */

(function () {
  "use strict";

  // ---------- 1. Константи бізнес-логіки ----------
  const STACK_SIZE = 64;          // блоків у стаку
  const SHULKER_SLOTS = 27;       // слотів у шалкері
  const RESERVE_MIN = 0;
  const RESERVE_MAX = 25;

  // Межі для полів. Висота 384 — максимальна висота світу в Minecraft 1.18+
  const LIMITS = {
    length: { min: 1, max: 256, name: "довжину", tooBig: "Максимум 256 блоків" },
    width:  { min: 1, max: 256, name: "ширину",  tooBig: "Максимум 256 блоків" },
    height: { min: 1, max: 384, name: "висоту",  tooBig: "Максимальна висота світу — 384 блоки" },
  };

  // ---------- 2. Пошук елементів (без падіння, якщо віджета немає на сторінці) ----------
  const root = document.getElementById("calculator");
  if (!root) return; // на інших сторінках віджета немає — тихо виходимо

  const get = (id) => root.querySelector("#" + id);
  const el = {
    form: get("calc-form"),
    shape: get("calc-shape"),
    length: get("calc-length"),
    width: get("calc-width"),
    height: get("calc-height"),
    reserve: get("calc-reserve"),
    reserveValue: get("calc-reserve-value"),
    shulker: get("calc-shulker"),
    total: get("calc-total"),
    stacks: get("calc-stacks"),
    shulkers: get("calc-shulkers"),
    shulkerRow: get("calc-shulker-row"),
    note: get("calc-note"),
  };

  const missing = Object.keys(el).filter((key) => !el[key]);
  if (missing.length) {
    console.warn("Калькулятор ресурсів: у HTML бракує елементів — " + missing.join(", "));
    return; // краще не запускати віджет, ніж падати з TypeError
  }

  const fmt = new Intl.NumberFormat("uk-UA");

  // ---------- 3. UI-стани полів (класи Tailwind) ----------
  const NORMAL = ["border-gray-600", "hover:border-gray-400", "focus-visible:border-blue-400", "focus-visible:ring-blue-500/30"];
  const ERROR = ["border-red-500", "focus-visible:border-red-500", "focus-visible:ring-red-500/30"];

  function showError(input, message) {
    input.classList.remove(...NORMAL);
    input.classList.add(...ERROR);
    input.setAttribute("aria-invalid", "true");
    const box = get(input.id + "-error");
    box.textContent = message; // textContent, а не innerHTML — захист від XSS
    box.classList.remove("hidden");
  }

  function clearError(input) {
    input.classList.remove(...ERROR);
    input.classList.add(...NORMAL);
    input.setAttribute("aria-invalid", "false");
    const box = get(input.id + "-error");
    box.textContent = "";
    box.classList.add("hidden");
  }

  // ---------- 4. Валідація одного розміру ----------
  // Повертає { value } або { error }. Ніколи не повертає NaN, Infinity чи від'ємне число.
  function readDimension(key) {
    const input = el[key];
    const limit = LIMITS[key];
    const raw = input.value.trim();

    // Браузер не зміг розібрати введене (наприклад «--5» або «e»): value тоді порожній
    if (input.validity && input.validity.badInput) return { error: "Введіть число, наприклад 10" };
    if (raw === "") return { error: "Вкажіть " + limit.name };

    const number = Number(raw); // Number, а не parseInt: parseInt("1e3") повертає 1
    if (!Number.isFinite(number)) return { error: "Введіть число, наприклад 10" };

    const rounded = Math.round(number); // блоки бувають лише цілі
    if (rounded < limit.min) return { error: "Мінімум " + limit.min + " блок" };
    if (rounded > limit.max) return { error: limit.tooBig };

    return { value: rounded, wasRounded: rounded !== number };
  }

  // ---------- 5. Бізнес-логіка ----------
  // Скільки блоків займає один горизонтальний «периметр» L×W
  function perimeter(L, W) {
    if (L <= 2 || W <= 2) return L * W; // вузька смуга — заповнена повністю
    return 2 * (L + W) - 4;
  }

  function countBlocks(shape, L, W, H) {
    switch (shape) {
      case "solid":
        return L * W * H;
      case "walls":
        return perimeter(L, W) * H;
      case "hollow":
        // Якщо хоч один вимір ≤ 2, «порожнини» всередині немає
        if (L <= 2 || W <= 2 || H <= 2) return L * W * H;
        return L * W * H - (L - 2) * (W - 2) * (H - 2);
      default:
        return null; // невідомий тип — не рахуємо
    }
  }

  function readReserve() {
    const value = Number(el.reserve.value);
    if (!Number.isFinite(value)) return 0;
    return Math.min(RESERVE_MAX, Math.max(RESERVE_MIN, value));
  }

  // ---------- 6. Головна функція перерахунку ----------
  function render() {
    const reserve = readReserve();
    el.reserveValue.textContent = reserve + " %";
    el.shulkerRow.classList.toggle("hidden", !el.shulker.checked);

    const dims = {};
    const rounded = [];
    let hasError = false;

    Object.keys(LIMITS).forEach((key) => {
      const result = readDimension(key);
      if (result.error) {
        showError(el[key], result.error);
        hasError = true;
      } else {
        clearError(el[key]);
        dims[key] = result.value;
        if (result.wasRounded) rounded.push(LIMITS[key].name.replace(/у$/, "а") + " → " + result.value);
      }
    });

    const blocks = hasError ? null : countBlocks(el.shape.value, dims.length, dims.width, dims.height);

    if (blocks === null || !Number.isSafeInteger(blocks) || blocks <= 0) {
      el.total.textContent = "—";
      el.stacks.textContent = "—";
      el.shulkers.textContent = "—";
      el.note.textContent = hasError ? "Виправ поля з помилками, щоб побачити розрахунок." : "Не вдалося порахувати: перевір тип конструкції.";
      return;
    }

    const total = Math.ceil(blocks * (1 + reserve / 100));
    const fullStacks = Math.floor(total / STACK_SIZE);
    const rest = total % STACK_SIZE;
    const slots = Math.ceil(total / STACK_SIZE);        // неповний стак теж займає слот
    const shulkers = Math.ceil(slots / SHULKER_SLOTS);

    el.total.textContent = fmt.format(total);
    if (fullStacks === 0) el.stacks.textContent = rest + " шт.";
    else el.stacks.textContent = rest ? fmt.format(fullStacks) + " + " + rest + " шт." : fmt.format(fullStacks);
    el.shulkers.textContent = fmt.format(shulkers);
    el.note.textContent = rounded.length
      ? "Дробові значення округлено: " + rounded.join(", ") + "."
      : (reserve ? "Враховано запас " + reserve + " %." : "");
  }

  // На blur записуємо в поле округлене значення, щоб користувач бачив, що саме порахували
  function normalizeOnBlur(event) {
    const result = readDimension(event.target.id.replace("calc-", ""));
    if (!result.error && result.wasRounded) {
      event.target.value = result.value;
      render();
    }
  }

  // ---------- 7. Події ----------
  el.form.addEventListener("submit", (event) => event.preventDefault()); // Enter не перезавантажує сторінку
  el.form.addEventListener("input", render);   // числа й повзунок — миттєво під час введення
  el.form.addEventListener("change", render);  // select і checkbox
  [el.length, el.width, el.height].forEach((input) => input.addEventListener("blur", normalizeOnBlur));

  render();
})();
