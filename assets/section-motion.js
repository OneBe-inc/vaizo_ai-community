const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const mobile = matchMedia("(max-width: 560px)");
const steps = document.querySelector(".steps");
const items = [...steps.children];
const circles = items.map((item) => item.querySelector(".step-number"));
const clamp = (value) => Math.max(0, Math.min(1, value));
let scheduled = 0;

// The connectors are decorative: all labels stay readable at every scroll position.
function drawProgress() {
  scheduled = 0;
  const bounds = circles.map((circle) => circle.getBoundingClientRect());
  let progress;
  if (reduced.matches) progress = 3;
  else if (mobile.matches) {
    const readingLine = innerHeight * 0.72;
    const centers = bounds.map((rect) => rect.top + rect.height / 2);
    progress = -1;
    if (readingLine >= centers[0]) {
      progress = 0;
      for (let i = 0; i < 3; i++) {
        progress =
          i + clamp((readingLine - centers[i]) / (centers[i + 1] - centers[i]));
        if (progress < i + 1) break;
      }
    }
  } else {
    const top = bounds[0].top;
    progress = ((innerHeight * 0.82 - top) / (innerHeight * 0.4)) * 3;
  }
  items.forEach((item, index) => {
    item.style.setProperty(
      "--line-progress",
      clamp(progress - index).toFixed(4),
    );
    item.classList.toggle("is-reached", progress >= index);
  });
}
function schedule() {
  if (!scheduled && !document.hidden)
    scheduled = requestAnimationFrame(drawProgress);
}
steps.classList.add("is-scroll-linked");
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", schedule, { passive: true });
new ResizeObserver(schedule).observe(document.querySelector(".light-zone"));
reduced.addEventListener("change", schedule);
mobile.addEventListener("change", schedule);
document.fonts.ready.then(schedule);
schedule();

const problem = document.querySelector(".problem");
const toggle = problem.querySelector(".problem-motion-toggle");
let paused = reduced.matches;
let inView = false;
function syncBackground() {
  problem.dataset.motion =
    !paused && inView && !document.hidden ? "running" : "paused";
  toggle.textContent = paused ? "背景の動きを再生" : "背景の動きを停止";
  toggle.setAttribute("aria-pressed", String(paused));
}
toggle.hidden = false;
toggle.addEventListener("click", () => {
  paused = !paused;
  syncBackground();
});
new IntersectionObserver(([entry]) => {
  inView = entry.isIntersecting;
  syncBackground();
}).observe(problem);
reduced.addEventListener("change", () => {
  paused = reduced.matches;
  syncBackground();
});
document.addEventListener("visibilitychange", () => {
  syncBackground();
  schedule();
});
syncBackground();
