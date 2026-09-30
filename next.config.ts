import type { NextConfig } from 'next';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
if (basePath && (!basePath.startsWith('/') || basePath.endsWith('/'))) throw new Error('NEXT_PUBLIC_BASE_PATH debe empezar con / y no terminar con /.');
const config: NextConfig = { output: 'export', basePath, trailingSlash: true, images: { unoptimized: true } };
export default config;
