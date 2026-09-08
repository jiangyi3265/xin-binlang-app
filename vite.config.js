import { defineConfig } from 'vite'
import uniModule from '@dcloudio/vite-plugin-uni'

const uni = typeof uniModule === 'function' ? uniModule : uniModule.default

export default defineConfig({
  plugins: [uni()],
  base: process.env.UNI_PLATFORM === 'h5' ? '/app/' : '/',
  server: {
    host: '127.0.0.1',
    port: 5273
  }
})
