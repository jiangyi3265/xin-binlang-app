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

test('a single-prize code pool reveals five other configured prizes and preserves the real reward', async () => {
  const app = runtime(); await app.signIn()
  const won = { id: 'won', type: 'cash', value: 2.08 }
  const other = [
    { id: 'pack30', type: 'exchange', value: 30, exchangeAmount: 8, name: '换购一包（30系列）' },
    { id: 'cash18', type: 'cash', value: 18.88 },
    { id: 'cash8', type: 'cash', value: 8.88 },
    { id: 'pack50', type: 'exchange', value: 50, exchangeAmount: 15, name: '换购一包（50系列）' },
    { id: 'phone', type: 'exchange', value: 5999, exchangeAmount: 888, name: '换购手机（512G）' }
  ]
  app.reply('/api/customer/draw/preview', { poolId: 'cash-only', prizes: [won], displayPrizes: [won, { ...won, id: 'same-value' }, ...other] })
  const record = { id: 'record', win: true, prizeId: won.id, prizeType: 'cash', prizeValue: 2.08, selectedCard: 2 }
  app.reply('/api/customer/draw', { ok: true, record })
  app.redeem.code = '123456'; await app.redeem.prepare(); await app.redeem.choose(2)
  clearTimeout(app.redeem.flipTimer)
  assert.equal(app.redeem.cardTitle, '¥2.08')
  assert.equal(app.redeem.selected, 2)
  assert.deepEqual(Array.from(app.redeem.cardPreviews, card => card.title), ['加 ¥8', '¥18.88', '¥8.88', '加 ¥15', '加 ¥888'])
  assert.equal(app.redeem.cardPreviews[0].detail, other[0].name)
  assert.equal(app.redeem.cardPreviews[4].detail, other[4].name)

  const { previewFor } = app.load('components/bl-flip-cards/bl-flip-cards.vue').default.methods
  for (let selected = 1; selected <= 6; selected++) {
    const remaining = [1, 2, 3, 4, 5, 6].filter(card => card !== selected)
    const titles = remaining.map(card => previewFor.call({ selected, previews: app.redeem.cardPreviews }, card).title)
    assert.deepEqual(titles, ['加 ¥8', '¥18.88', '¥8.88', '加 ¥15', '加 ¥888'])
  }
})

test('display-only preview prizes remain cosmetic and never replace the server reward', async () => {
  const app = runtime(); await app.signIn()
  const won = { id: 'won', type: 'cash', value: 2.08 }
  const displayOnly = { id: 'display-only', type: 'exchange', value: 50, exchangeAmount: 15, name: '展示用换购奖品', displayOnly: true, showcaseWeight: 100 }
  app.reply('/api/customer/draw/preview', { poolId: 'cash-only', prizes: [won], displayPrizes: [displayOnly, won] })
  const draw = app.hold('/api/customer/draw')
  app.redeem.code = '123456'; await app.redeem.prepare()
  const pending = app.redeem.choose(4)
  assert.deepEqual(JSON.parse(JSON.stringify(draw().data)), { code: '123456', selectedCard: 4 })
  draw().success({ statusCode: 200, data: { ok: true, data: { ok: true, record: { id: 'record', win: true, prizeId: won.id, prizeType: 'cash', prizeValue: 2.08, selectedCard: 4 } } } })
  await pending
  clearTimeout(app.redeem.flipTimer)

  assert.equal(app.redeem.cardTitle, '¥2.08')
  assert.equal(app.redeem.result.record.prizeId, won.id)
  assert.deepEqual(JSON.parse(JSON.stringify(app.redeem.cardPreviews)), [{ title: '加 ¥15', detail: displayOnly.name }])
  assert.equal(app.requests.filter(path => path === '/api/customer/draw').length, 1)
})

test('a sampled winner can be replaced by another real pool prize without restoring omitted showcase prizes', async () => {
  const app = runtime(); await app.signIn()
  const won = { id: 'won', type: 'cash', value: 2.08 }
  const omittedDisplay = { id: 'phone', type: 'exchange', value: 5999, exchangeAmount: 666, name: '加 ¥666 中 iPhone 18 Pro Max 512G', showcaseWeight: 0.1 }
  const fallback = { id: 'fallback', type: 'cash', value: 5 }
  app.reply('/api/customer/draw/preview', { prizes: [won, fallback], displayPrizes: [won] })
  app.reply('/api/customer/draw', { ok: true, record: { id: 'record', win: true, prizeId: won.id, prizeType: 'cash', prizeValue: 2.08, selectedCard: 1 } })
  app.redeem.code = '123456'; await app.redeem.prepare(); await app.redeem.choose(1)
  clearTimeout(app.redeem.flipTimer)
  assert.deepEqual(Array.from(app.redeem.cardPreviews, card => card.title), ['¥5'])
  assert.equal(app.redeem.cardPreviews.some(card => card.detail === omittedDisplay.name), false)
})

test('other reward cards deduplicate configured rewards and handle limited or empty prize lists honestly', () => {
  const app = runtime()
  const { otherRewardCards } = app.load('utils/presentation.js')
  const { previewFor } = app.load('components/bl-flip-cards/bl-flip-cards.vue').default.methods
  const won = { id: 'won', type: 'cash', value: 2.08 }
  const record = { win: true, prizeId: won.id, prizeType: 'cash', prizeValue: 2.08 }
  const empty = otherRewardCards([won, { ...won, id: 'duplicate' }], record)
  assert.equal(empty.length, 0)
  assert.equal(previewFor.call({ selected: 1, previews: empty }, 2).title, '暂无其他奖项')
  const previews = otherRewardCards([won, { id: 'a', type: 'cash', value: 8.88 }, { id: 'b', type: 'cash', value: 8.88 }], record)
  assert.equal(previews.length, 1)
  assert.ok([1, 3, 4, 5, 6].every(card => previewFor.call({ selected: 2, previews }, card).title === '¥8.88'))
  assert.equal(otherRewardCards([won], { win: false })[0].title, '¥2.08')
  // ID matching also excludes the won prize after its admin-configured name or value changes.
  assert.equal(otherRewardCards([{ ...won, value: 10 }], record).length, 0)
  assert.equal(otherRewardCards([{ id: 'hidden', type: 'cash', value: 99, showcaseWeight: 0 }, { id: 'visible', type: 'cash', value: 8.88 }], record).length, 1)
})

test('older preview APIs supplement the code pool with currently configured public prizes', async () => {
  const app = runtime(); await app.signIn()
  const won = { id: 'won', type: 'cash', value: 2.08 }
  app.reply('/api/customer/draw/preview', { poolId: 'cash-only', prizes: [won] })
  app.reply('/api/public/prizes', [won, { id: 'other', type: 'exchange', value: 50, exchangeAmount: 15, name: '补15元换50元深蓝装' }])
  app.redeem.code = '123456'; await app.redeem.prepare()
  app.redeem.result = { record: { win: true, prizeId: won.id, prizeType: 'cash', prizeValue: 2.08 } }
  assert.equal(app.redeem.cardPreviews.length, 1)
  assert.equal(app.redeem.cardPreviews[0].title, '加 ¥15')
  assert.equal(app.redeem.cardPreviews[0].detail, '补15元换50元深蓝装')
  assert.equal(app.requests.includes('/api/customer/draw'), false)
})

test('an explicit empty display list stays empty instead of restoring public prizes', async () => {
  const app = runtime(); await app.signIn()
  const won = { id: 'won', type: 'cash', value: 2.08 }
  app.reply('/api/customer/draw/preview', { prizes: [won], displayPrizes: [] })
  app.reply('/api/public/prizes', [{ id: 'excluded-by-server', type: 'cash', value: 99 }])
  app.requests.length = 0
  app.redeem.code = '123456'; await app.redeem.prepare()
  assert.equal(app.redeem.cardPreviews.length, 0)
  assert.equal(app.requests.includes('/api/public/prizes'), false)
  const { previewFor } = app.load('components/bl-flip-cards/bl-flip-cards.vue').default.methods
  assert.equal(previewFor.call({ selected: 1, previews: app.redeem.cardPreviews }, 2).title, '暂无其他奖项')
})

test('a successful result cannot be submitted or reshuffled again while its flip animation starts', async () => {
  const app = runtime(); await app.signIn()
  app.reply('/api/customer/draw/preview', { displayPrizes: Array.from({ length: 5 }, (_, index) => ({ id: 'display-' + index, type: 'cash', value: index + 10 })) })
  app.reply('/api/customer/draw', { ok: true, record: { id: 'record', win: true, prizeId: 'won', prizeType: 'cash', prizeValue: 2.08, selectedCard: 2 } })
  app.redeem.code = '123456'; await app.redeem.prepare(); await app.redeem.choose(2)
  clearTimeout(app.redeem.flipTimer)
  const order = Array.from(app.redeem.previewOrder)
  assert.equal(app.redeem.revealed, false)
  await app.redeem.choose(2)
  clearTimeout(app.redeem.flipTimer)
  assert.equal(app.requests.filter(path => path === '/api/customer/draw').length, 1)
  assert.deepEqual(Array.from(app.redeem.previewOrder), order)
  app.redeem.again()
  assert.equal(app.redeem.previewOrder.length, 0)
})

test('a delayed legacy public-prize response cannot restore another code context', async () => {
  const app = runtime(); await app.signIn()
  app.reply('/api/customer/draw/preview', { prizes: [{ type: 'cash', value: 2.08 }] })
  const held = app.hold('/api/public/prizes')
  app.redeem.code = '123456'; const pending = app.redeem.prepare()
  await new Promise(resolve => setImmediate(resolve))
  app.redeem.onInput({ detail: { value: '654321' } }); clearTimeout(app.redeem.previewTimer)
  held().success({ statusCode: 200, data: { ok: true, data: [{ type: 'cash', value: 10 }] } })
  await pending
  assert.equal(app.redeem.codeContext, null)
  assert.equal(app.redeem.stage, 'input')
})

test('showcase placement leaves the chosen card empty and assigns every display prize once', () => {
  const app = runtime()
  const { randomPreviewOrder } = app.load('pages/redeem/redeem.vue').default.methods
  const order = randomPreviewOrder(3, 5)
  assert.equal(order.length, 6)
  assert.equal(order[2], null)
  assert.deepEqual(Array.from(order).filter(Number.isInteger).sort((a, b) => a - b), [0, 1, 2, 3, 4])
  const capped = randomPreviewOrder(3, 6)
  assert.deepEqual(Array.from(capped).filter(Number.isInteger).sort((a, b) => a - b), [0, 1, 2, 3, 4])
})
