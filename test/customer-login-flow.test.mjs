import test from 'node:test'
import assert from 'node:assert/strict'
import { runtime } from './helpers/client-runtime.mjs'

test('login returns a previously rendered guest to card selection with the same code, without a second login', async () => {
  const app = runtime()
  assert.equal(app.redeem.logged, false)
  app.redeem.code = '123456'
  app.redeem.prepare()
  assert.equal(app.loginNavigations, 1)
  await app.signIn()
  assert.equal(app.redeem.logged, true)
  assert.equal(app.redeem.code, '123456')
  assert.equal(app.redeem.stage, 'choose')
  app.redeem.again(); app.redeem.code = '234567'; app.redeem.prepare()
  assert.equal(app.redeem.stage, 'choose')
  assert.equal(app.loginNavigations, 1)
  assert.equal(app.requests.includes('/api/customer/draw'), false)
})

test('a temporary data refresh failure does not require another WeChat login', async () => {
  const app = runtime(); await app.signIn()
  assert.equal(app.redeem.logged, true)
  app.fail('network')
  await app.store.syncCustomer({ throwOnError: false })
  assert.equal(app.store.state.connection, 'offline')
  assert.equal(app.redeem.logged, true)
  app.redeem.code = '123456'; app.redeem.prepare()
  assert.equal(app.loginNavigations, 0)
  assert.equal(app.redeem.stage, 'choose')
})

test('a server-rejected session returns to login, then unlocks the cards after reauthentication', async () => {
  const app = runtime(); await app.signIn()
  app.redeem.code = '123456'; app.redeem.prepare()
  app.fail('draw-expired'); await app.redeem.choose(3)
  assert.equal(app.redeem.logged, false)
  assert.equal(app.loginNavigations, 1)
  app.fail(''); await app.signIn()
  assert.equal(app.redeem.logged, true)
  assert.equal(app.redeem.selected, 0)
  assert.equal(app.redeem.stage, 'choose')
  assert.equal(app.redeem.code, '123456')
})

test('unsuccessful login and explicit logout never leave an authenticated page', async () => {
  const app = runtime()
  assert.equal(app.redeem.logged, false)
  app.fail('bootstrap'); await app.signIn()
  assert.equal(app.redeem.logged, false)
  assert.equal(app.store.state.customerToken, '')
  app.fail(''); await app.signIn()
  assert.equal(app.redeem.logged, true)
  app.store.logoutCustomer(false)
  assert.equal(app.redeem.logged, false)
  assert.equal(app.api.hasCustomerSession(), false)
})

test('a late failure from an older session cannot clear a newly authenticated session', async () => {
  const app = runtime(); await app.signIn()
  const pending = app.hold('/api/customer/bootstrap')
  const staleSync = app.store.syncCustomerRequest().catch(() => false)
  const oldRequest = pending()
  app.store.state.customerToken = 'unit-test-new-session'
  app.api.grantCustomerSession()
  oldRequest.success({ statusCode: 401, data: { ok: false, error: { code: 'ERR_AUTH', message: 'Expired old session' } } })
  await staleSync
  assert.equal(app.store.state.customerToken, 'unit-test-new-session')
  assert.equal(app.redeem.logged, true)
})
