import { test, expect } from "@playwright/test";
test("page renders without script errors or missing images", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "本来やりたかった",
  );
  await page.locator("#use-cases").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".case-image img")
        .evaluateAll((imgs) =>
          imgs.every((i) => i.complete && i.naturalWidth > 0),
        ),
    )
    .toBe(true);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  expect(errors).toEqual([]);
});
test("unconfigured CTA has honest dialog and restores focus", async ({
  page,
}) => {
  await page.goto("/");
  const cta = page.locator(".hero-copy [data-cta]");
  await cta.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("受付準備中");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(cta).toBeFocused();
});
test("FAQ expands with keyboard", async ({ page }) => {
  await page.goto("/");
  const q = page.locator("summary").nth(1);
  await q.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details").nth(1)).toHaveAttribute("open", "");
  await expect(page.locator("details").nth(1)).toContainText(
    "操作・構築はご本人",
  );
});
test("configured CTA points to given https URL without contacting it", async ({
  page,
}) => {
  await page.route("**/site-config.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: 'export const siteConfig = {ctaUrl:"https://example.com/guide",companyUrl:"",privacyUrl:"",termsUrl:"",commerceUrl:"",releaseReady:false};',
    }),
  );
  await page.goto("/");
  const cta = page.locator(".hero-copy [data-cta]");
  await expect(cta).toHaveAttribute("href", "https://example.com/guide");
  await expect(cta).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.locator("[data-unconfigured]")).toBeHidden();
});
test("mobile menu closes on navigation and escape", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile);
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "メニュー" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page
    .locator("#site-navigation")
    .getByRole("link", { name: "活用例" })
    .click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});
test("layout fits common widths and problem/support share surfaces", async ({
  page,
}, testInfo) => {
  for (const width of [320, 375, 390, 560, 768, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      String(width),
    ).toBe(true);
  }
  const colors = await page
    .locator(".problem .surface-card, .support .surface-card")
    .evaluateAll((nodes) =>
      nodes.map((n) => getComputedStyle(n).backgroundColor),
    );
  expect(new Set(colors).size).toBe(1);
  await page.locator("#use-cases").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".case-image img")
        .evaluateAll((imgs) =>
          imgs.every((i) => i.complete && i.naturalWidth > 0),
        ),
    )
    .toBe(true);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "artifacts/" + testInfo.project.name + "-wide.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/" + testInfo.project.name + "-narrow.png",
    fullPage: true,
  });
});
test("content remains available without JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-unconfigured]")).toContainText("受付準備中");
  await ctx.close();
});
