import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'path'


export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,js}",
    }), 
    svgr()
  ],
  resolve: {
    alias: {
      
      '@': path.resolve(__dirname, './src'),
      crypto: 'crypto-browserify'
    },
    extensions: ['.js', '.jsx', '.json']
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'build',
    sourcemap: false, // Disable sourcemap để tiết kiệm memory
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách vendor chunks để tối ưu memory
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@heroicons/react', 'lucide-react', 'react-icons'],
          utils: ['lodash', 'axios', 'date-fns', 'dayjs'],
          charts: ['apexcharts', 'chart.js', 'react-apexcharts'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000, // Tăng giới hạn warning
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log trong production
        drop_debugger: true
      }
    }
  },
  define: {
    'process.env': process.env,
    global: {}
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  }
}) 