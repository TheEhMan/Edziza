import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin development proxy prevents NASA's CORS policy from disabling
    // a genuine WebGL Moon globe or the on-demand LOLA GeoTIFF download.
    // Static deployments should run npm run fetch:nasa before npm run build.
    proxy: {
      '/trek-remote': {
        target: 'https://trek.nasa.gov',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/trek-remote/, '')
      },
      '/mars-pds-remote': {
        target: 'https://pds-geosciences.wustl.edu',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/mars-pds-remote/, '')
      },
      '/nasa-remote': {
        target: 'https://svs.gsfc.nasa.gov',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/nasa-remote/, '')
      }
    }
  }
});
