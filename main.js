import { siteConfig } from "./site-config.js";
const validUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
  } catch {
    return "";
  }
};
const destination = validUrl(siteConfig.ctaUrl);
const dialog = document.querySelector("#preparation-dialog");
let returnFocus;
document.querySelectorAll("[data-cta]").forEach((link) => {
  if (destination) {
    link.href = destination;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute(
      "aria-label",
      "サービス案内を受け取る（新しいタブで開きます）",
    );
  } else {
    link.addEventListener("click", (event) => {
      if (!dialog?.showModal) return;
      event.preventDefault();
      returnFocus = link;
      dialog.showModal();
    });
  }
});
document
  .querySelector("[data-dialog-close]")
  ?.addEventListener("click", () => dialog.close());
dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  }
});
dialog?.addEventListener("close", () => returnFocus?.focus());
if (destination) {
  document.querySelector("[data-unconfigured]")?.setAttribute("hidden", "");
  document.querySelector("[data-configured]")?.removeAttribute("hidden");
}
document.querySelectorAll("[data-config-link]").forEach((item) => {
  const url = validUrl(siteConfig[item.dataset.configLink]);
  if (url) {
    const a = document.createElement("a");
    a.href = url;
    a.textContent = item.textContent;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    item.replaceWith(a);
  }
});
const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector("#site-navigation");
const closeMenu = () => {
  toggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
};
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
});
nav
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    toggle.getAttribute("aria-expanded") === "true"
  ) {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!nav.contains(event.target) && !toggle.contains(event.target))
    closeMenu();
});
matchMedia("(min-width: 821px)").addEventListener("change", closeMenu);
