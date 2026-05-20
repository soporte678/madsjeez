/** Slug público para /tienda/[slug] */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_LEN = 3;
const MAX_LEN = 48;

export function slugifyStoreName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LEN)
    .replace(/-+$/g, "");
}

export function isValidStoreSlug(slug: string): boolean {
  return slug.length >= MIN_LEN && slug.length <= MAX_LEN && SLUG_REGEX.test(slug);
}

export function suggestStoreSlug(base: string, suffix?: string): string {
  let slug = slugifyStoreName(base);
  if (slug.length < MIN_LEN) slug = `tienda-${suffix ?? "madsjeez"}`.slice(0, MAX_LEN);
  if (suffix && !slug.endsWith(suffix)) {
    const withSuffix = `${slug}-${suffix}`.slice(0, MAX_LEN).replace(/-+$/g, "");
    if (withSuffix.length >= MIN_LEN) slug = withSuffix;
  }
  return slug;
}
