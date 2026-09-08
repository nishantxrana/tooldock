import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * The Azure DevOps REST API does not send CORS headers, so the browser cannot
 * call https://dev.azure.com directly. All app code calls the relative base
 * path `/ado/*`; in development this Vite proxy forwards those requests to
 * Azure DevOps. In production an equivalent reverse-proxy rewrite is used
 * (see vercel.json / netlify.toml / nginx.conf.example).
 *
 * The PAT only ever travels from the browser toward Azure DevOps via this
 * proxy. It is never stored or logged.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/ado': {
        target: 'https://dev.azure.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/ado/, ''),
        // Strip browser cookies before forwarding. The browser shares cookies
        // across all of localhost (any port), so unrelated dev-app cookies would
        // otherwise be sent to Azure DevOps and cause 400 Bad Request. ADO only
        // needs the Authorization (Basic PAT) header.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('cookie');
          });
        },
      },
      // Release definitions live on vsrm.dev.azure.com (a separate ADO subdomain).
      '/vsrm': {
        target: 'https://vsrm.dev.azure.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/vsrm/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('cookie');
          });
        },
      },
    },
  },
});
