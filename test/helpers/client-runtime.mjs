import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { computed, reactive } from 'vue'

const require = createRequire(import.meta.url)
const vue = require('vue')
const { initPreContext, preJs } = createRequire(require.resolve('@dcloudio/vite-plugin-uni/package.json'))('@dcloudio/uni-cli-shared')
const { transformSync } = createRequire(require.resolve('vite/package.json'))('esbuild')
const root = fileURLToPath(new URL('../../', import.meta.url))

export function runtime(options = {}) {
  const cache = new Map(), storage = new Map(), requests = [], pages = [], replies = new Map()
  let failure = '', loginCount = 0, loginNavigations = 0, held = null
  const uni = {
    getStorageSync: key => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: key => storage.delete(key),
    showToast() {}, vibrateShort() {},
    navigateTo(options) { loginNavigations++; pages.push({ route: options.url.split('?')[0].slice(1) }); options.complete?.() },
    navigateBack() { pages.pop(); redeemOptions.onShow.call(redeem) },
    switchTab() {},
    login(options) { loginCount++; options.success({ code: 'unit-test-wechat-code' }) },
    request(options) {
      const path = new URL(options.url).pathname
      requests.push(path)
      if (replies.has(path)) return options.success({ statusCode: 200, data: { ok: true, data: replies.get(path) } })
      if (held?.path === path) { held.options = options; return }
      if (failure === 'network' && path === '/api/customer/records') return options.fail({ errMsg: 'request:fail timeout' })
      if (failure === 'expired' && path === '/api/customer/bootstrap' || failure === 'draw-expired' && path === '/api/customer/draw') {
        return options.success({ statusCode: 401, data: { ok: false, error: { code: 'ERR_AUTH', message: '登录已失效' } } })
      }
      if (failure === 'bootstrap' && path === '/api/customer/bootstrap') {
        return options.success({ statusCode: 503, data: { ok: false, error: { code: 'ERR_HTTP', message: '服务暂不可用' } } })
      }
      const data = path === '/api/store/auth/login' ? { token: 'unit-test-store-session', account: { id: 'test-owner', username: 'test-owner', role: 'owner', storeId: 'test-store' } }
        : path === '/api/store/bootstrap' ? { account: { id: 'test-owner', username: 'test-owner', role: 'owner', storeId: 'test-store' }, stats: {} }
        : path === '/api/store/orders' || path === '/api/store/logs' ? { items: [] }
        : path === '/api/customer/auth/wechat' ? { token: 'unit-test-session-' + loginCount, user: { id: 'test-customer' } }
        : path === '/api/customer/bootstrap' ? { user: { id: 'test-customer' }, config: {}, stores: [], pools: [], prizes: [] }
        : path === '/api/customer/draw/preview' ? { priceCents: 0, presentation: { theme: 'neutral' }, prizes: [] }
        : path === '/api/public/config' ? {} : []
      options.success({ statusCode: 200, data: { ok: true, data } })
    }
  }
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports
    const module = { exports: {} }; cache.set(file, module)
    let source = readFileSync(file, 'utf8')
    if (file.endsWith('.vue')) source = source.match(/<script>([\s\S]*?)<\/script>/)[1]
    initPreContext('mp-weixin')
    const code = transformSync(preJs(source, file), { format: 'cjs', target: 'es2020', define: {
      'import.meta.env.VITE_API_ORIGIN': JSON.stringify('https://xbinglangs.oksja.cn'),
      'import.meta.env.VITE_USE_WECHAT_LOGIN': JSON.stringify('true'),
      'import.meta.env.VITE_WECHAT_TEMPLATE_IDS': JSON.stringify('')
    } }).code
    runInNewContext(code, { module, exports: module.exports, uni, wx: options.wx, getCurrentPages: () => pages, setTimeout, clearTimeout, setInterval, clearInterval,
      require: path => path === 'vue' ? vue : load(path.startsWith('@/') ? resolve(root, path.slice(2)) : resolve(dirname(file), path))
    })
    return module.exports
  }
  function instance(options) {
    const page = reactive(options.data())
    for (const [key, method] of Object.entries(options.methods || {})) page[key] = method.bind(page)
    for (const [key, getter] of Object.entries(options.computed || {})) {
      const value = computed(() => getter.call(page))
      Object.defineProperty(page, key, { get: () => value.value })
    }
    return page
  }
  const store = load(resolve(root, 'store/index.js')).default
  const api = load(resolve(root, 'utils/api.js'))
  const redeemOptions = load(resolve(root, 'pages/redeem/redeem.vue')).default
  const redeem = instance(redeemOptions)
  const login = instance(load(resolve(root, 'pages/auth/login.vue')).default)
  pages.push({ route: 'pages/index/index' }, { route: 'pages/redeem/redeem' })
  return { store, api, redeem, login, requests, pages, instance, load: path => load(resolve(root, path)),
    reply(path, value) { replies.set(path, value) },
    get loginNavigations() { return loginNavigations },
    fail(value) { failure = value },
    hold(path) { held = { path }; return () => held.options },
    async signIn() { login.agreed = true; await login.submit(); await new Promise(resolve => setImmediate(resolve)) }
  }
}
