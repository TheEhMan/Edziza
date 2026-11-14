import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin development proxy prevents NASA's CORS policy from disabling
    // a genuine WebGL Moon globe or the on-demand LOLA GeoTIFF download.
    // Static deployments should run npm run fetch:nasa before npm run build.
    proxy: {
      '/nasa-remote': {
        target: 'https://svs.gsfc.nasa.gov',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/nasa-remote/, '')
      }
    }
  }
});
