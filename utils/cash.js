import { request } from './api.js'
import store from '@/store/index.js'

export function cashStatus(id) {
	return request('/customer/records/' + encodeURIComponent(id) + '/cash', {}, store.state.customerToken)
}

export async function claimCash(id) {
	// The recipient OpenID belongs to the mini program, so collection must use that same app.
	let supported = false
	// #ifdef MP-WEIXIN
	supported = typeof wx !== 'undefined' && wx.canIUse('requestMerchantTransfer')
	// #endif
	if (!supported) throw new Error('请在新版微信中打开倌榔小程序领取红包')
	const result = await request('/customer/records/' + encodeURIComponent(id) + '/cash/claim', { method: 'POST', data: {} }, store.state.customerToken)
	// #ifdef MP-WEIXIN
	if (result.state === 'WAIT_USER_CONFIRM' && result.confirmation) {
		await new Promise(resolve => wx.requestMerchantTransfer({ ...result.confirmation, success: resolve, fail: resolve }))
	}
	// #endif
	// A successful JSAPI callback only means the confirmation page opened. Ask the server for settlement.
	return cashStatus(id)
}
