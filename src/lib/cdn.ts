const CDN_BASE_URL = "https://cdn.edengrupo.com.br";

type CdnFolder = "banners" | "avatar" | "thumb";

function toSafePath(value: string): string {
  return value.trim().replace(/^\/+/, "").replace(/\/+/g, "/");
}

function tryExtractPathname(value: string): string {
  try {
    const url = new URL(value);
    return url.pathname;
  } catch {
    return value;
  }
}

function hasKnownFolderPrefix(path: string): boolean {
  return path.startsWith("banners/") || path.startsWith("avatar/") || path.startsWith("thumb/");
}

function buildCdnUrl(path: string, folder?: CdnFolder): string {
  const extracted = toSafePath(tryExtractPathname(path));
  if (!extracted) return CDN_BASE_URL;
  const normalized = hasKnownFolderPrefix(extracted)
    ? extracted
    : folder
      ? `${folder}/${extracted}`
      : extracted;
  return `${CDN_BASE_URL}/${normalized}`;
}

export function cdnBanner(path: string): string {
  return buildCdnUrl(path, "banners");
}

export function cdnAvatar(path: string): string {
  return buildCdnUrl(path, "avatar");
}

export function cdnThumb(path: string): string {
  return buildCdnUrl(path, "thumb");
}

export function cdnPublicAsset(path: string): string {
  return buildCdnUrl(path);
}

export function cdnMaterial(path: string): string {
  return buildCdnUrl(path);
}
