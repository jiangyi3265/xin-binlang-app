import test from 'node:test'
import assert from 'node:assert/strict'
import { runtime } from './helpers/client-runtime.mjs'

const customerRecord = { id: 'own-record', code: '123456', userId: 'test-customer', win: true, status: 'pending' }
const storeRecord = { id: 'store-record', code: '234567', userId: 'another-customer', win: true, status: 'pending' }

test('customer and store sessions retain separate records through refresh and logout', async () => {
  const app = runtime()
  app.reply('/api/customer/records', [customerRecord])
  app.reply('/api/store/orders', { items: [storeRecord] })
  await app.signIn()
  await app.store.loginCredentials('test-owner', 'unit-test-only')
  assert.deepEqual(Array.from(app.store.myRecords(), row => row.id), ['own-record'])
  assert.deepEqual(Array.from(app.store.storeOrders(), row => row.id), ['store-record'])
  assert.equal(app.store.recordById('store-record'), undefined)
  await app.store.syncCustomer()
  assert.deepEqual(Array.from(app.store.storeOrders(), row => row.id), ['store-record'])
  app.store.logout()
  assert.deepEqual(Array.from(app.store.myRecords(), row => row.id), ['own-record'])
  assert.equal(app.store.storeOrders().length, 0)
})

test('an old store refresh cannot restore an account after logout', async () => {
  const app = runtime(); await app.store.loginCredentials('test-owner', 'unit-test-only')
  const pending = app.hold('/api/store/bootstrap')
  const refresh = app.store.syncStoreData()
  const response = pending()
  app.store.logout()
  response.success({ statusCode: 200, data: { ok: true, data: { account: { id: 'test-owner', role: 'owner' }, stats: {} } } })
  await refresh
  assert.equal(app.store.state.remoteAccount, null)
  assert.equal(app.store.state.onlineStore, false)
})

test('a late receipt response cannot repopulate a signed-out customer cache', async () => {
  const app = runtime(); await app.signIn()
  const pending = app.hold('/api/customer/records/own-record')
  const refresh = app.store.refreshCustomerRecord('own-record').catch(error => error.code)
  const response = pending()
  app.store.logoutCustomer(false)
  response.success({ statusCode: 200, data: { ok: true, data: customerRecord } })
  await refresh
  assert.equal(app.store.state.records.length, 0)
  assert.equal(app.store.recordById('own-record'), undefined)
})

test('receipt authentication expiry clears the session rather than polling with an invalid token', async () => {
  const app = runtime(); await app.signIn()
  const pending = app.hold('/api/customer/records/own-record')
  const refresh = app.store.refreshCustomerRecord('own-record').catch(error => error.code)
  pending().success({ statusCode: 401, data: { ok: false, error: { code: 'ERR_AUTH', message: 'expired' } } })
  assert.equal(await refresh, 'ERR_AUTH')
  assert.equal(app.store.isCustomerAuthenticated(), false)
})

test('a store network timeout preserves its authenticated session for retry', async () => {
  const app = runtime(); await app.store.loginCredentials('test-owner', 'unit-test-only')
  const pending = app.hold('/api/store/bootstrap')
  const refresh = app.store.syncStoreData()
  pending().fail({ errMsg: 'request:fail timeout' })
  assert.equal(await refresh, false)
  assert.equal(app.store.isStoreAuthenticated(), true)
  assert.equal(app.store.state.onlineStore, false)
})

test('foreground refresh follows the active portal when both accounts are logged in', async () => {
  const app = runtime(); await app.signIn(); await app.store.loginCredentials('test-owner', 'unit-test-only')
  app.requests.length = 0
  await app.store.syncActive()
  assert.ok(app.requests.includes('/api/customer/bootstrap'))
  assert.equal(app.requests.includes('/api/store/bootstrap'), false)
  app.pages.push({ route: 'pagesStore/home/home' }); app.requests.length = 0
  await app.store.syncActive()
  assert.ok(app.requests.includes('/api/store/bootstrap'))
  assert.equal(app.requests.includes('/api/customer/bootstrap'), false)
})

test('receipt detail hides the previous account receipt immediately on logout or account switch', async () => {
  const app = runtime(); await app.signIn()
  const detail = app.instance(app.load('pages/record/detail.vue').default)
  detail.currentRecord = customerRecord; detail.recordSession = app.store.state.customerToken
  assert.equal(detail.rec.id, customerRecord.id)
  app.store.logoutCustomer(false)
  assert.equal(detail.rec, null)
  await app.signIn()
  assert.equal(detail.rec, undefined)
})

test('a draw response arriving after logout is not inserted into another session', async () => {
  const app = runtime(); await app.signIn()
  const pending = app.hold('/api/customer/draw')
  const draw = app.store.redeem('123456', 1)
  const response = pending()
  app.store.logoutCustomer(false)
  response.success({ statusCode: 200, data: { ok: true, data: { ok: true, record: customerRecord } } })
  assert.equal((await draw).code, 'ERR_SESSION_CHANGED')
  assert.equal(app.store.state.records.length, 0)
})
