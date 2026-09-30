/** Next prefixes its links; plain fetch/image URLs need the same build-time prefix. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export function publicPath(path: string) { return `${basePath}/${path.replace(/^\/+/, '')}`; }
export function appPath(path: string) {
  return basePath && (path === basePath || path.startsWith(`${basePath}/`) || path.startsWith(`${basePath}?`)) ? path.slice(basePath.length) || '/' : path;
}
