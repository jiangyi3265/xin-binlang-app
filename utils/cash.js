import { request } from './api.js'
import store from '@/store/index.js'

export function cashStatus(id) {
	return request('/customer/records/' + encodeURIComponent(id) + '/cash', {}, store.state.customerToken)
}

export async function claimCash(id) {
	// The recipient OpenID belongs to the mini program, so collection must use that same app.
	let supported = false
	// #ifdef MP-WEIXIN
	supported = typeof wx !== 'undefined' && typeof wx.requestMerchantTransfer === 'function' && typeof wx.canIUse === 'function' && wx.canIUse('requestMerchantTransfer')
	// #endif
	if (!supported) throw new Error('请在新版微信中打开倌榔小程序领取红包')
	const result = await request('/customer/records/' + encodeURIComponent(id) + '/cash/claim', { method: 'POST', data: {} }, store.state.customerToken)
	let feedback = ''
	// #ifdef MP-WEIXIN
	if (result.state === 'WAIT_USER_CONFIRM' && result.confirmation) {
		const confirmation = await new Promise(resolve => {
			try {
				wx.requestMerchantTransfer({ ...result.confirmation,
					success: () => resolve({ ok: true }),
					fail: error => resolve({ ok: false, cancelled: /cancel/i.test(String(error?.errMsg || '')) })
				})
			} catch { resolve({ ok: false, cancelled: false }) }
		})
		if (!confirmation.ok) feedback = confirmation.cancelled
			? '你已取消微信收款，可再次点击确认领取。'
			: '微信收款页面未能打开，请稍后重试；仍失败请联系商家。'
	} else {
		return result.state === 'WAIT_USER_CONFIRM'
			? { ...result, feedback: '正在获取微信收款凭证，请稍后再次点击领取。' }
			: result
	}
	// #endif
	// A successful JSAPI callback only means the confirmation page opened. Ask the server for settlement.
	const latest = await cashStatus(id)
	return latest.state === 'SUCCESS' ? latest : { ...latest, feedback }
}
