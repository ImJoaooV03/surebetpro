import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite conexões externas
    port: 5173,
    allowedHosts: true, // Libera qualquer host (corrige bloqueios do Vite 6)
    cors: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
