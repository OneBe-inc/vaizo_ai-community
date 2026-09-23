import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({
    content: "html { scroll-behavior: auto !important; }",
  });
});

test("approved portrait, number font and continuous section backgrounds load", async ({
  page,
}) => {
  await expect(
    page.locator(".hero-art, .hero-english, .network-label"),
  ).toHaveCount(0);
  await page.locator("#approach").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".approach-portrait img")
        .evaluate((img) => img.complete && img.naturalWidth === 1145),
    )
    .toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".price strong")).toHaveCSS(
    "font-family",
    /VAIZO Numbers/,
  );
  expect(
    await page.evaluate(() =>
      document.fonts.check('400 74px "VAIZO Numbers"', "9800"),
    ),
  ).toBe(true);
  await expect(page.locator(".trust-zone > section")).toHaveCount(2);
  await expect(page.locator(".membership")).toHaveCSS(
    "background-image",
    "none",
  );
  await expect(page.locator(".faq")).toHaveCSS("background-image", "none");
  const bg = await page
    .locator(".light-zone")
    .evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).not.toContain("url(");
});

test("FV moves automatically and pauses without reacting to the pointer", async ({
  page,
}) => {
  const canvas = page.locator(".hero-motion");
  const supported = await canvas.evaluate((el) => !!el.getContext("webgl"));
  test.skip(
    !supported,
    "WebGL unavailable: the separate fallback test covers this device",
  );
  await expect(canvas).toHaveClass(/is-ready/);
  const clock = () =>
    canvas.evaluate((el) => {
      const gl = el.getContext("webgl");
      const program = gl.getParameter(gl.CURRENT_PROGRAM);
      return gl.getUniform(program, gl.getUniformLocation(program, "time"));
    });
  const initial = await clock();
  await expect.poll(clock).toBeGreaterThan(initial);
  await page.locator(".hero .motion-toggle").click();
  await expect(page.locator(".hero")).toHaveAttribute("data-motion", "paused");
  const frozen = await clock();
  await page.mouse.move(100, 200);
  await page.waitForTimeout(200);
  expect(await clock()).toBe(frozen);
  await page.locator(".hero .motion-toggle").click();
  await expect.poll(clock).toBeGreaterThan(frozen);
});

test("roadmap fills with scroll and reduced motion completes it without animation", async ({
  page,
}) => {
  const place = async (fraction) => {
    await page
      .locator(".steps")
      .evaluate(
        (el, f) =>
          scrollTo(
            0,
            scrollY + el.getBoundingClientRect().top - innerHeight * f,
          ),
        fraction,
      );
  };
  await place(0.95);
  await expect(page.locator(".steps .is-reached")).toHaveCount(0);
  await place(0.55);
  await expect
    .poll(() => page.locator(".steps .is-reached").count())
    .toBeGreaterThan(0);
  await page
    .locator(".steps > li")
    .last()
    .evaluate((el) =>
      scrollTo(
        0,
        scrollY + el.getBoundingClientRect().top - innerHeight * 0.35,
      ),
    );
  await expect(page.locator(".steps .is-reached")).toHaveCount(4);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await place(0.95);
  await expect(page.locator(".steps .is-reached")).toHaveCount(4);
  expect(
    await page
      .locator("#problem")
      .evaluate((el) => getComputedStyle(el, "::before").animationName),
  ).toBe("none");
  if (await page.locator(".hero-motion").evaluate((el) => !!el.getContext("webgl"))) {
    await expect(page.locator(".hero")).toHaveAttribute("data-motion", "paused");
  } else {
    await expect(page.locator(".hero .motion-toggle")).toBeHidden();
  }
});

test("problem background pauses independently; content does not move", async ({
  page,
}) => {
  await page.locator("#problem").scrollIntoViewIfNeeded();
  await expect(page.locator("#problem")).toHaveAttribute(
    "data-motion",
    "running",
  );
  const transform = () =>
    page
      .locator("#problem")
      .evaluate((el) => getComputedStyle(el, "::before").transform);
  const box = await page
    .locator(".problem .surface-card")
    .first()
    .boundingBox();
  const before = await transform();
  await expect.poll(transform).not.toBe(before);
  expect(
    await page.locator(".problem .surface-card").first().boundingBox(),
  ).toEqual(box);
  await page.locator(".problem-motion-toggle").click();
  await expect(page.locator("#problem")).toHaveAttribute(
    "data-motion",
    "paused",
  );
  expect(
    await page
      .locator("#problem")
      .evaluate((el) => getComputedStyle(el, "::before").animationPlayState),
  ).toBe("paused");
});

test("static FV fallback remains usable when WebGL is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === "webgl" ? null : original.call(this, type, ...args);
    };
  });
  await page.reload();
  await expect(page.locator(".hero .motion-toggle")).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".hero-copy [data-cta]")).toHaveAttribute(
    "href",
    "https://lin.ee/7B8VhdZi",
  );
  expect(
    await page
      .locator(".hero")
      .evaluate((el) => getComputedStyle(el).backgroundImage),
  ).toContain("blue-filaments.webp");
});
