import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss() ],
  resolve: {
    alias: {
      '@morpheus': path.resolve(__dirname, './morpheus'),
      '@morphSrc': path.resolve(__dirname, './morphSrc'),
      '@morphBuildSrc': path.resolve(__dirname, './morphBuildSrc'),

    },
    extensions: ['.js', '.jsx', '.json']  // ADD THIS LINE
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: [
          path.resolve(__dirname, './src/morpheus/dev/ui'),
          path.resolve(__dirname, './src/morphSrc'),
        ]
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  server: {
    port: 3000,
    open: true,
  }, 
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude the directories from being bundled
        return id.includes('morpheus/core/resourceCompiler') || 
               id.includes('morpheus/dev');
      }
    }
  }
});