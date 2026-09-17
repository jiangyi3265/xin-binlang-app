import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { runtime } from './helpers/client-runtime.mjs'

const pages = JSON.parse(readFileSync(new URL('../pages.json', import.meta.url), 'utf8')).pages

test('consumer pages share only the public activity, including when a private receipt is open', () => {
	const app = runtime()
	const requestCount = app.requests.length
	const privateContext = {
		code: '123456', token: 'unit-test-session',
		rec: { id: 'private-receipt', code: '123456', prizeType: 'cash' },
		user: { openid: 'private-user', phone: 'private-phone' },
		cfg: { poster: 'https://example.invalid/private-image' }
	}
	for (const { path } of pages) {
		const page = app.load(path + '.vue').default
		assert.equal(typeof page.onShareAppMessage, 'function', path)
		for (const from of ['button', 'menu']) {
			const result = page.onShareAppMessage.call(privateContext, { from, target: { dataset: privateContext } })
			assert.equal(result.path, '/pages/index/index', path)
			assert.match(result.title, /倌榔/)
			assert.equal(result.imageUrl, '/static/share/guanlang.jpg')
			assert.deepEqual(Object.keys(result).sort(), ['imageUrl', 'path', 'title'])
			for (const value of ['123456', 'private-receipt', 'private-user', 'unit-test-session', 'private-image']) {
				assert.equal(JSON.stringify(result).includes(value), false, path)
			}
			assert.ok(existsSync(new URL('..' + result.imageUrl, import.meta.url)))
		}
	}
	assert.equal(app.requests.length, requestCount, 'Sharing must not log in, draw or claim a reward')
})
