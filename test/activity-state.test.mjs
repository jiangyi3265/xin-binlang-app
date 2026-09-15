import test from 'node:test'
import assert from 'node:assert/strict'
import { runtime } from './helpers/client-runtime.mjs'

test('a known paused activity does not send the customer to login or consume a code', async () => {
  const app = runtime()
  Object.assign(app.store.state.config, { active: false, actStart: '2026-09-14' })
  app.redeem.code = '123456'
  app.redeem.prepare()
  await app.redeem.choose(2)
  assert.equal(app.redeem.activityPaused, true)
  assert.equal(app.loginNavigations, 0)
  assert.equal(app.requests.includes('/api/customer/draw'), false)
  assert.equal(app.redeem.code, '123456')
})

test('refreshing a paused activity preserves the code, and reopening enables selection without an automatic draw', async () => {
  const app = runtime(); await app.signIn()
  app.redeem.code = '123456'; app.redeem.stage = 'choose'; app.redeem.errorCode = 'ERR_CLOSED'
  app.reply('/api/public/config', { active: false, actStart: '2026-09-14' })
  await app.redeem.refreshActivity()
  assert.equal(app.redeem.activityPaused, true)
  assert.match(app.redeem.tip, /无需更换兑换码/)
  app.reply('/api/public/config', { active: true, actStart: '2026-09-14' })
  await app.redeem.refreshActivity()
  assert.equal(app.redeem.activityPaused, false)
  assert.equal(app.redeem.code, '123456')
  assert.equal(app.redeem.stage, 'choose')
  assert.equal(app.requests.includes('/api/customer/draw'), false)
})

test('server pause after card selection unlocks the selection and offers activity refresh', async () => {
  const app = runtime(); await app.signIn()
  app.redeem.code = '123456'; app.redeem.prepare()
  const held = app.hold('/api/customer/draw')
  const draw = app.redeem.choose(3)
  held().success({ statusCode: 409, data: { ok: false, error: { code: 'ERR_CLOSED', message: '活动已暂停，请关注后续公告' } } })
  await draw
  assert.equal(app.redeem.selected, 0)
  assert.equal(app.redeem.activityPaused, true)
  assert.equal(app.redeem.code, '123456')
})

test('a paused activity still allows recovery of an uncertain draw with the same selected card', async () => {
  const app = runtime(); await app.signIn()
  app.redeem.code = '123456'; app.redeem.stage = 'choose'; app.redeem.selected = 4
  Object.assign(app.store.state.config, { active: false, actStart: '2026-09-14' })
  app.reply('/api/customer/draw', { ok: true, record: { id: 'existing-result', code: '123456', selectedCard: 4, win: false } })
  assert.equal(app.redeem.activityPaused, false)
  await app.redeem.choose(4)
  assert.equal(app.redeem.rec.id, 'existing-result')
  clearTimeout(app.redeem.flipTimer)
})
