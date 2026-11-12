const menuToggle = document.querySelector(".menu-toggle");
const mainNavigation = document.querySelector("#primary-navigation");

const setMenuOpen = (isOpen) => {
  mainNavigation.classList.toggle("hidden", !isOpen);
  mainNavigation.classList.toggle("block", isOpen);
  menuToggle.setAttribute("aria-expanded", isOpen);
  menuToggle.setAttribute("aria-label", isOpen ? "Закрити меню" : "Відкрити меню");
};

menuToggle.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

mainNavigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});
