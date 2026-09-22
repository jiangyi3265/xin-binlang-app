import { publicAsset } from './api.js'

export function packagingView(presentation = {}, priceCents = 0) {
  presentation ||= {}
  const theme = presentation.theme && presentation.theme !== 'auto' ? presentation.theme : Number(priceCents) === 3000 ? 'gold' : Number(priceCents) === 5000 ? 'blue' : 'neutral'
  return { ...presentation, theme,
    productImg: publicAsset(presentation.productImg || (theme === 'gold' ? '/assets/guanlang-product-30.png' : theme === 'blue' ? '/assets/guanlang-product-50.jpg' : '')),
    backgroundImg: publicAsset(presentation.backgroundImg || '/assets/guanlang-botanical-blue.png'),
    tintBackground: presentation.tintBackground ?? (!presentation.backgroundImg && theme === 'gold') }
}

export function launchContext(options = {}) {
  let query = ''
  try { query = decodeURIComponent(String(options.q || options.scene || '')) } catch {}
  const code = String(options.code || (/^[0-9]{6}$/.test(query) ? query : '') || query.match(/(?:^|[?&])code=([a-z0-9]{6})(?:&|$)/i)?.[1] || '').toUpperCase()
  const tier = String(options.tier || query.match(/(?:^|[?&])tier=(30|50)(?:&|$)/)?.[1] || '')
  return { code: /^[A-Z0-9]{6}$/.test(code) ? code : '', priceCents: tier === '30' ? 3000 : tier === '50' ? 5000 : 0 }
}

export function rewardCard(prize = {}) {
  return { title: prize.type === 'cash' ? '¥' + prize.value : prize.type === 'exchange' ? '加 ¥' + prize.exchangeAmount : prize.name,
    detail: prize.type === 'cash' ? '现金红包' : prize.type === 'exchange' ? prize.name || '换购 ¥' + prize.value + ' 商品' : prize.spec || '实物奖品' }
}

export function otherRewardCards(prizes = [], record = {}) {
  const keyFor = (prize, card) => JSON.stringify([prize.type, card.title, card.detail])
  const seen = new Set()
  if (record.win) {
    const won = { type: record.prizeType, value: record.prizeValue, exchangeAmount: record.exchangeAmount, name: record.prizeName, spec: record.prizeSpec }
    seen.add(keyFor(won, rewardCard(won)))
  }
  return prizes.flatMap(prize => {
    // Newer preview APIs may return showcase metadata. A zero/negative
    // showcase weight is an explicit opt-out; older payloads omit it and
    // continue to use the default equal-display behavior.
    const showcaseWeight = prize && prize.showcaseWeight == null ? 1 : Number(prize?.showcaseWeight)
    if (Number.isFinite(showcaseWeight) && showcaseWeight <= 0) return []
    if (record.win && record.prizeId && prize.id === record.prizeId) return []
    const card = rewardCard(prize), key = keyFor(prize, card)
    if (seen.has(key)) return []
    seen.add(key)
    return [card]
  })
}
