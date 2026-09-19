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
    detail: prize.type === 'cash' ? '现金红包' : prize.type === 'exchange' ? '换购 ¥' + prize.value + ' 商品' : prize.spec || '实物奖品' }
}
