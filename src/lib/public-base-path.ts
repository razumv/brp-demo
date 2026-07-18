const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function publicAssetPath(path: string) {
  if (!path.startsWith("/")) return path;
  return `${publicBasePath}${path}`;
}
