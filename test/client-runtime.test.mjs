import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { WECHAT_CONFIG } from '../config/wechat.mjs'
import { contentTopInset, miniProgramContentTop } from '../utils/navigation.mjs'

const require = createRequire(import.meta.url)
const { initPreContext, preJs } = createRequire(require.resolve('@dcloudio/vite-plugin-uni/package.json'))('@dcloudio/uni-cli-shared')
const { transformSync } = createRequire(require.resolve('vite/package.json'))('esbuild')
const source = readFileSync(new URL('../utils/api.js', import.meta.url), 'utf8')

function loadApi(platform, enabled = false) {
	initPreContext(platform)
	const code = transformSync(preJs(source, 'utils/api.js'), {
		format: 'cjs', target: 'es2020',
		define: {
			'import.meta.env.VITE_API_ORIGIN': JSON.stringify('http://127.0.0.1:8897'),
			'import.meta.env.VITE_USE_WECHAT_LOGIN': JSON.stringify(String(enabled)),
			'import.meta.env.VITE_WECHAT_TEMPLATE_IDS': JSON.stringify('')
		}
	}).code
	const module = { exports: {} }
	let requested
	runInNewContext(code, {
		module, exports: module.exports,
		require: path => { assert.equal(path, '@/config/wechat.mjs'); return { WECHAT_CONFIG } },
		uni: {
			getStorageSync: key => key === 'xbl_api_origin' ? 'http://stale-debug-host:8897' : '',
			request: options => { requested = options; options.success({ statusCode: 200, data: { ok: true, data: { accepted: true } } }) }
		}
	})
	return { api: module.exports, request: () => requested }
}

test('WeChat login and authenticated API ignore disabled H5 settings and a stale debug origin', async () => {
	const { api, request } = loadApi('mp-weixin', false)
	assert.equal(api.shouldUseWechatLogin(), true)
	assert.equal(api.apiOrigin(), WECHAT_CONFIG.apiOrigin)
	await api.request('/customer/auth/wechat', { method: 'POST', data: { code: 'local-test-code' } })
	assert.equal(request().url, WECHAT_CONFIG.apiOrigin + '/api/customer/auth/wechat')
	assert.equal(request().data.code, 'local-test-code')
})

test('H5 keeps its explicit development configuration', () => {
	assert.equal(loadApi('h5', false).api.shouldUseWechatLogin(), false)
	assert.equal(loadApi('h5', true).api.shouldUseWechatLogin(), true)
	assert.equal(loadApi('h5').api.apiOrigin(), 'http://stale-debug-host:8897')
})

test('brand content stays below the iPhone safe area and WeChat capsule', () => {
	assert.ok(contentTopInset({ statusBarHeight: 59, safeArea: { top: 59 } }, { bottom: 103 }) >= 115)
	assert.ok(contentTopInset({ statusBarHeight: 24 }, { bottom: 96 }) >= 108)
	assert.ok(contentTopInset({ statusBarHeight: 24 }, { bottom: 0 }) >= 68)
})

test('older devices and unavailable menu measurements retain a safe header inset', () => {
	const top = miniProgramContentTop({
		getWindowInfo() { throw new Error('unsupported') },
		getSystemInfoSync() { return { statusBarHeight: 44 } },
		getMenuButtonBoundingClientRect() { throw new Error('not ready') }
	})
	assert.ok(top >= 88)
	assert.ok(miniProgramContentTop({}) >= 64)
})
