import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import {
  validHttpsUrl,
  resolveConfig,
  assertReleaseReady,
} from "../scripts/config.mjs";
import { siteConfig } from "../site-config.js";
test("CTA defaults to the approved destination", () =>
  assert.equal(resolveConfig(siteConfig).ctaUrl, "https://lin.ee/7B8VhdZi"));
test("only https destinations without credentials are accepted", () => {
  for (const s of [
    "",
    null,
    "http://example.com",
    "javascript:alert(1)",
    "data:text/html,x",
    "https://user:secret@example.com",
  ])
    assert.equal(validHttpsUrl(s), "");
  assert.equal(
    validHttpsUrl("https://example.com/guide"),
    "https://example.com/guide",
  );
});
test("environment can set destination; invalid input rejects build", () => {
  assert.equal(
    resolveConfig(siteConfig, { VAIZO_CTA_URL: "https://example.com/guide" })
      .ctaUrl,
    "https://example.com/guide",
  );
  assert.throws(() =>
    resolveConfig(siteConfig, { VAIZO_CTA_URL: "javascript:x" }),
  );
});
test("release is blocked until URLs and approval are present", () => {
  assert.throws(() => assertReleaseReady(resolveConfig(siteConfig)));
  assert.doesNotThrow(() =>
    assertReleaseReady({
      ...siteConfig,
      ctaUrl: "https://example.com",
      privacyUrl: "https://example.com/privacy",
      termsUrl: "https://example.com/terms",
      commerceUrl: "https://example.com/commerce",
      releaseReady: true,
    }),
  );
});
test("document has expected sections, unique IDs and real assets", async () => {
  const html = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of [
    "problem",
    "support",
    "use-cases",
    "membership",
    "faq",
    "join",
  ])
    assert(ids.includes(id));
  assert(html.includes("noindex, nofollow"));
  for (const m of html.matchAll(/href="#([^"]+)"/g))
    assert(ids.includes(m[1]), m[1]);
  for (const m of html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g))
    assert((await stat(new URL("../" + m[1], import.meta.url))).size > 0);
  assert(!html.includes("LINE"));
});
