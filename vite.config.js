import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-maplibre', test: /node_modules\/maplibre-gl/ },
            { name: 'vendor-three', test: /node_modules\/three/ },
            { name: 'data-palembang-paths', test: /src\/satellite\/data\/palembang-paths\.json/ },
          ],
        },
      },
    },
  },
});
