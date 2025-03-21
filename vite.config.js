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
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build',
    sourcemap: true,
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