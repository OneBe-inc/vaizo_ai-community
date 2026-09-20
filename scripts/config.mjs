export function validHttpsUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.href;
  } catch {
    return "";
  }
}
export function resolveConfig(base, env = {}) {
  const candidate = env.VAIZO_CTA_URL ?? base.ctaUrl;
  const ctaUrl = validHttpsUrl(candidate);
  if (candidate && !ctaUrl)
    throw new Error(
      "CTA URL must be a valid https URL without embedded credentials.",
    );
  return {
    ...base,
    ctaUrl,
    companyUrl: validHttpsUrl(base.companyUrl),
    privacyUrl: validHttpsUrl(base.privacyUrl),
    termsUrl: validHttpsUrl(base.termsUrl),
    commerceUrl: validHttpsUrl(base.commerceUrl),
    releaseReady:
      env.VAIZO_RELEASE_READY === undefined
        ? base.releaseReady
        : env.VAIZO_RELEASE_READY === "true",
  };
}
export function assertReleaseReady(config) {
  const missing = [];
  if (!config.ctaUrl) missing.push("CTA URL");
  if (!config.privacyUrl) missing.push("privacy URL");
  if (!config.termsUrl) missing.push("terms URL");
  if (!config.commerceUrl) missing.push("commercial disclosure URL");
  if (!config.releaseReady) missing.push("release checklist approval");
  if (missing.length) throw new Error("Release blocked: " + missing.join(", "));
}
