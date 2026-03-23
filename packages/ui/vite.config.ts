import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [react(), tailwindcss()];
  const coverageStage = Number(process.env.COVERAGE_STAGE || '1');
  const coverageThreshold = coverageStage >= 3 ? 80 : coverageStage >= 2 ? 70 : 40;

  if (mode === 'analyze') {
    plugins.push(
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode === 'production' || process.env.E2E_COVERAGE === '1',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          /**
           * Vite 8+ (rolldown) expects `manualChunks` to be a function.
           */
          manualChunks(id) {
            const normalizedId = id.replaceAll('\\', '/');
            const inNodeModules = normalizedId.includes('/node_modules/');
            if (!inNodeModules) {
              return;
            }

            const isNodeModulePackage = (pkgName: string): boolean =>
              normalizedId.includes(`/node_modules/${pkgName}/`) ||
              normalizedId.endsWith(`/node_modules/${pkgName}`);

            const reactPackages = ['react', 'react-dom', 'react-router-dom'];
            if (reactPackages.some(isNodeModulePackage)) {
              return 'react-vendor';
            }

            if (isNodeModulePackage('flexsearch')) {
              return 'search';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 3000,
      open: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        all: true,
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'tests/**', 'src/types/**', 'src/main.tsx'],
        thresholds: {
          branches: coverageThreshold,
          functions: coverageThreshold,
          lines: coverageThreshold,
          statements: coverageThreshold,
        },
      },
    },
  };
});
