/* =============================================
   MineCalc UA — клієнтська валідація форми зворотного зв'язку (ЛР №9)
   Vanilla JS, без сторонніх бібліотек.
   ============================================= */

// ---------- 1. Регулярні вирази ----------

// Ім'я: 2–50 символів, лише літери (українські та латинські), пробіл, дефіс, апостроф.
// ^ і $ — збіг з усім рядком, {2,50} — довжина, ʼ ’ ' — різні варіанти апострофа.
const NAME_REGEX = /^[A-Za-zА-ЩЬЮЯҐЄІЇа-щьюяґєії'’ʼ\- ]{2,50}$/;

// Email: локальна частина @ домен . зона з 2+ літер. Крапка в домені екранована як \.
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Телефон: рівно «+380» і далі рівно 9 цифр. \+ — екранований плюс, \d{9} — 9 цифр.
const PHONE_REGEX = /^\+380\d{9}$/;

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 1000;

// ---------- 2. Елементи DOM ----------

const form = document.getElementById("feedbackForm");
const submitBtn = document.getElementById("submitBtn");
const modal = document.getElementById("successModal");
const modalCard = document.getElementById("modalCard");
const closeModalBtn = document.getElementById("closeModalBtn");
const messageCounter = document.getElementById("messageCounter");

const fields = {
  userName: document.getElementById("userName"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  message: document.getElementById("message"),
  agreement: document.getElementById("agreement"),
};

// Поля, з якими користувач уже взаємодіяв (blur або submit).
// До першої взаємодії помилки не показуємо, щоб не «сварити» людину, яка ще не дописала.
const touched = new Set();

// ---------- 3. UI-стани: normal / error / success ----------

// Класи Tailwind для кожного стану рамки. Зайві класи знімаємо, щоб вони не перебивали один одного.
const STATE_CLASSES = {
  normal: ["border-gray-600", "hover:border-gray-400", "focus-visible:border-blue-400", "focus-visible:ring-blue-500/30"],
  error: ["border-red-500", "focus-visible:border-red-500", "focus-visible:ring-red-500/30"],
  success: ["border-green-500", "focus-visible:border-green-500", "focus-visible:ring-green-500/30"],
};
const ALL_STATE_CLASSES = Object.values(STATE_CLASSES).flat();

function setState(input, state) {
  input.classList.remove(...ALL_STATE_CLASSES);
  input.classList.add(...STATE_CLASSES[state]);
}

function getErrorElement(input) {
  return document.getElementById(input.id + "Error");
}

// Показати помилку під полем: червона рамка + текст + aria-invalid для зчитувачів екрана.
function showError(input, message) {
  const errorEl = getErrorElement(input);
  if (input.type !== "checkbox") setState(input, "error");
  input.setAttribute("aria-invalid", "true");
  errorEl.textContent = message; // textContent, а не innerHTML: введений текст не стане HTML-кодом
  errorEl.classList.remove("hidden");
}

// Позначити поле як правильне: зелена рамка, текст помилки прихований.
function showSuccess(input) {
  const errorEl = getErrorElement(input);
  if (input.type !== "checkbox") setState(input, "success");
  input.setAttribute("aria-invalid", "false");
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

// Повернути поле в початковий стан (після reset форми).
function clearError(input) {
  const errorEl = getErrorElement(input);
  if (input.type !== "checkbox") setState(input, "normal");
  input.setAttribute("aria-invalid", "false");
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
}

// ---------- 4. Функції валідації ----------
// Кожна повертає текст помилки або порожній рядок, якщо все гаразд.

function validateName() {
  const value = fields.userName.value.trim();
  if (value === "") return "Введіть ім'я.";
  if (value.length < 2) return "Ім'я має містити щонайменше 2 символи.";
  if (!NAME_REGEX.test(value)) return "Ім'я може містити лише літери, пробіл, дефіс або апостроф.";
  return "";
}

function validateEmail() {
  const value = fields.email.value.trim();
  if (value === "") return "Введіть email.";
  if (!EMAIL_REGEX.test(value)) return "Перевірте email: він має виглядати як name@example.com.";
  return "";
}

function validatePhone() {
  const value = fields.phone.value.trim();
  if (value === "") return "Введіть номер телефону.";
  if (/[^\d+\s()\-]/.test(value)) return "Номер може містити лише цифри та знак + на початку.";
  if (!PHONE_REGEX.test(value)) {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("380") && digits.length < 12) return `Замало цифр: після +380 потрібно 9 цифр, зараз ${digits.length - 3}.`;
    if (digits.startsWith("380") && digits.length > 12) return `Забагато цифр: після +380 потрібно 9 цифр, зараз ${digits.length - 3}.`;
    return "Номер має бути у форматі +380XXXXXXXXX.";
  }
  return "";
}

function validateMessage() {
  const value = fields.message.value.trim();
  if (value === "") return "Напишіть повідомлення.";
  if (value.length < MESSAGE_MIN) return `Повідомлення занадто коротке: потрібно щонайменше ${MESSAGE_MIN} символів, зараз ${value.length}.`;
  if (value.length > MESSAGE_MAX) return `Повідомлення задовге: максимум ${MESSAGE_MAX} символів.`;
  return "";
}

function validateAgreement() {
  return fields.agreement.checked ? "" : "Потрібна ваша згода з політикою конфіденційності.";
}

const validators = {
  userName: validateName,
  email: validateEmail,
  phone: validatePhone,
  message: validateMessage,
  agreement: validateAgreement,
};

// Перевірити одне поле і відобразити результат. Повертає true, якщо поле правильне.
function validateField(name) {
  const error = validators[name]();
  if (error) showError(fields[name], error);
  else showSuccess(fields[name]);
  return error === "";
}

// ---------- 5. UX-функція: нормалізація телефону ----------
// Окрема від RegEx: регулярний вираз лише перевіряє, а ця функція допомагає користувачу.
// Прибирає пробіли, дужки й дефіси та дописує +38 / + там, де людина ввела номер без коду.
// Приклади: «050 123 45 67» → «+380501234567», «380501234567» → «+380501234567».
function normalizePhone(raw) {
  const cleaned = raw.trim().replace(/[\s()\-]/g, "");
  if (/^0\d{9}$/.test(cleaned)) return "+38" + cleaned;
  if (/^380\d{9}$/.test(cleaned)) return "+" + cleaned;
  return cleaned;
}

// ---------- 6. Динамічна валідація: input / blur / change ----------

Object.keys(fields).forEach((name) => {
  const input = fields[name];

  // blur — фінальна перевірка поля, коли користувач з нього вийшов
  input.addEventListener("blur", () => {
    if (name === "phone" && input.value.trim() !== "") {
      const normalized = normalizePhone(input.value);
      if (normalized !== input.value) input.value = normalized;
    }
    if (name === "agreement") return; // для чекбокса достатньо change
    touched.add(name);
    validateField(name);
  });

  // input — перевірка під час введення, але лише для полів, яких уже торкались
  input.addEventListener("input", () => {
    if (name === "message") updateCounter();
    if (touched.has(name)) validateField(name);
  });

  // change — для чекбокса
  if (name === "agreement") {
    input.addEventListener("change", () => {
      touched.add(name);
      validateField(name);
    });
  }
});

function updateCounter() {
  const length = fields.message.value.length;
  messageCounter.textContent = `${length} / ${MESSAGE_MAX}`;
  messageCounter.classList.toggle("text-red-400", length > 0 && fields.message.value.trim().length < MESSAGE_MIN);
}

// ---------- 7. Submit ----------

form.addEventListener("submit", (event) => {
  event.preventDefault(); // не перезавантажувати сторінку і не надсилати форму без перевірки

  // Захист від швидкого повторного натискання
  if (submitBtn.disabled) return;

  if (fields.phone.value.trim() !== "") fields.phone.value = normalizePhone(fields.phone.value);

  let firstInvalid = null;
  Object.keys(fields).forEach((name) => {
    touched.add(name);
    const isValid = validateField(name);
    if (!isValid && !firstInvalid) firstInvalid = fields[name];
  });

  // Якщо хоча б одне поле невірне — не «надсилаємо» і переводимо фокус на першу помилку
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Надсилаємо…";

  // Імітація надсилання: бекенду немає, тому просто показуємо модальне вікно
  setTimeout(() => {
    openModal();
    resetForm();
  }, 400);
});

function resetForm() {
  form.reset();
  touched.clear();
  Object.values(fields).forEach(clearError);
  updateCounter();
  submitBtn.disabled = false;
  submitBtn.textContent = "Надіслати";
}

// ---------- 8. Модальне вікно ----------

function openModal() {
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.classList.add("overflow-hidden"); // блокуємо прокрутку сторінки під вікном
  closeModalBtn.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
  submitBtn.focus(); // повертаємо фокус туди, звідки користувач відкрив вікно
}

closeModalBtn.addEventListener("click", closeModal);

// Клік по затемненому фону закриває вікно, клік усередині картки — ні
modal.addEventListener("click", (event) => {
  if (!modalCard.contains(event.target)) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (modal.classList.contains("hidden")) return;
  if (event.key === "Escape") closeModal();
  // У вікні одна кнопка, тож Tab / Shift+Tab тримаємо на ній (focus trap)
  if (event.key === "Tab") {
    event.preventDefault();
    closeModalBtn.focus();
  }
});
