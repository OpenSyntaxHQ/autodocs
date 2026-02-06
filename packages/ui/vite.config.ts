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
      sourcemap: mode === 'production',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            search: ['flexsearch'],
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
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        all: true,
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/types/**', 'src/main.tsx'],
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
