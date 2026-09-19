import test from 'node:test'
import assert from 'node:assert/strict'
import { runtime } from './helpers/client-runtime.mjs'

test('late showcase updates refresh the visible store list and selected packaging', async () => {
  const app = runtime()
  const home = app.instance(app.load('pages/index/index.vue').default)
  app.store.state.displayPrice = 3000
  assert.equal(home.nearStores.length, 0)
  assert.match(home.campaign.productImg, /product-30/)
  app.reply('/api/public/stores', [{ id: 'local-store', short: '本地测试门店', addr: '', img: '' }])
  app.reply('/api/public/pools', [{ id: 'local-pool', presentation: { theme: 'gold', productImg: '/uploads/custom-pack.png' } }])
  await app.store.loadPublicShowcase()
  assert.equal(home.nearStores.length, 1)
  assert.match(home.campaign.productImg, /custom-pack/)
  app.store.applyStores([])
  assert.equal(home.nearStores.length, 0)
})

test('30 and 50 packaging, generic entry, and scan parameters remain distinct', () => {
  const app = runtime()
  const { packagingView, launchContext, rewardCard } = app.load('utils/presentation.js')
  assert.equal(packagingView({}, 3000).theme, 'gold')
  assert.match(packagingView({}, 3000).productImg, /product-30/)
  assert.equal(packagingView({}, 5000).theme, 'blue')
  assert.match(packagingView({}, 5000).productImg, /product-50/)
  assert.equal(packagingView({}, 0).productImg, '')
  assert.equal(launchContext({ q: encodeURIComponent('https://example.test/?tier=30&code=123456') }).priceCents, 3000)
  assert.equal(launchContext({ code: '1234567' }).code, '')
  assert.equal(launchContext({ scene: '003030' }).code, '003030')
  assert.equal(packagingView(null, 3000).theme, 'gold')
  assert.equal(rewardCard({ type: 'exchange', value: 30, exchangeAmount: 8 }).title, '加 ¥8')
})

test('preparing cards uses server packaging rather than the selected homepage tier and never draws', async () => {
  const app = runtime(); await app.signIn()
  app.store.state.displayPrice = 5000
  app.reply('/api/customer/draw/preview', { poolId: 'pool30', priceCents: 3000, presentation: { theme: 'gold' }, guaranteed: false, prizes: [{ type: 'cash', value: 2.08 }] })
  app.redeem.code = '123456'; await app.redeem.prepare()
  assert.equal(app.redeem.stage, 'choose')
  assert.equal(app.redeem.campaign.theme, 'gold')
  assert.equal(app.redeem.cardPreviews[0].title, '¥2.08')
  assert.equal(app.requests.includes('/api/customer/draw'), false)
})

test('a delayed packaging preview cannot open card selection for another code or signed-out session', async () => {
  const app = runtime(); await app.signIn()
  const held = app.hold('/api/customer/draw/preview')
  app.redeem.code = '123456'; const pending = app.redeem.prepare()
  const response = held()
  app.store.logoutCustomer(false)
  response.success({ statusCode: 200, data: { ok: true, data: { priceCents: 3000, presentation: { theme: 'gold' } } } })
  await pending
  assert.equal(app.redeem.stage, 'input')
  assert.equal(app.redeem.codeContext, null)
})
