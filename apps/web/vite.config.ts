import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { serveLegalDocuments } from './serveLegalDocuments';

export default defineConfig({
  plugins: [
    {
      name: 'local-legal-documents',
      configureServer(server) {
        server.middlewares.use(serveLegalDocuments(new URL('../../legal/', import.meta.url)));
      },
      configurePreviewServer(server) {
        server.middlewares.use(serveLegalDocuments(new URL('../../legal/', import.meta.url)));
      },
    },
    // Plugin router phải đứng trước plugin React để sinh routeTree trước khi biên dịch.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: 'src/app/routes',
      generatedRouteTree: 'src/app/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@src': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
