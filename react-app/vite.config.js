import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Each React page is its own entry. `vite build` writes plain JS files into
// ../react-dist, and the page's .html (in the project root) loads that file with
// <script type="module">. Everything stays on the same address as the rest of the
// site (Live Server), so the login token in localStorage is shared.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../react-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'seat-selection': 'src/seat-selection/main.jsx',
        movies: 'src/movies/main.jsx',
        'booking-history': 'src/booking-history/main.jsx',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'shared-[hash].js',
      },
    },
  },
});
