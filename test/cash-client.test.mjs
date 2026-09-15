import test from 'node:test'
import assert from 'node:assert/strict'
import { runtime } from './helpers/client-runtime.mjs'

test('WeChat confirmation callbacks never mark money received without the server result', async () => {
  for (const callback of ['success', 'fail']) {
    let confirmations = 0
    const app = runtime({ wx: { canIUse: () => true, requestMerchantTransfer(options) { confirmations++; options[callback]({}) } } })
    await app.signIn()
    app.reply('/api/customer/records/local-cash/cash/claim', { state: 'WAIT_USER_CONFIRM', confirmation: { appId: 'local-app', mchId: 'local-merchant', package: 'local-confirmation' } })
    app.reply('/api/customer/records/local-cash/cash', { state: 'WAIT_USER_CONFIRM' })
    const cash = app.load('utils/cash.js')
    assert.equal((await cash.claimCash('local-cash')).state, 'WAIT_USER_CONFIRM')
    assert.equal(confirmations, 1)
    app.reply('/api/customer/records/local-cash/cash', { state: 'SUCCESS' })
    assert.equal((await cash.cashStatus('local-cash')).state, 'SUCCESS')
  }
})

test('an unsupported WeChat client does not submit a cash claim', async () => {
  const app = runtime({ wx: { canIUse: () => false } })
  await app.signIn(); app.requests.length = 0
  await assert.rejects(app.load('utils/cash.js').claimCash('local-cash'), /新版微信/)
  assert.equal(app.requests.length, 0)
})

test('cash collection is unavailable when merchant configuration is not ready', () => {
  const app = runtime()
  const panel = app.instance(app.load('components/bl-cash-claim/bl-cash-claim.vue').default)
  panel.record = { id: 'local-cash', status: 'pending', prizeValue: 2 }
  panel.payment = { ready: false, state: 'UNCLAIMED' }
  assert.equal(panel.canClaim, false)
  assert.match(panel.description, /暂未开放/)
})
