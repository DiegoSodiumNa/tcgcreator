import { afterEach, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it.each(['', '/tcgcreator'])('recursos y navegación con basePath %s', async prefix => {
  vi.stubEnv('NEXT_PUBLIC_BASE_PATH', prefix); vi.resetModules();
  const { publicPath, appPath } = await import('../../src/lib/paths');
  expect(publicPath('/fonts/NotoSans-Regular.ttf')).toBe(`${prefix}/fonts/NotoSans-Regular.ttf`);
  expect(appPath(`${prefix}/guia/`)).toBe('/guia/');
  expect(appPath('/otra/')).toBe('/otra/');
  expect(appPath('/tcgcreator2/')).toBe('/tcgcreator2/');
});
