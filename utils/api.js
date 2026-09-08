const BUILD_ORIGIN = import.meta.env && import.meta.env.VITE_API_ORIGIN
const BUILD_WECHAT_LOGIN = import.meta.env && import.meta.env.VITE_USE_WECHAT_LOGIN
const BUILD_TEMPLATE_IDS = import.meta.env && import.meta.env.VITE_WECHAT_TEMPLATE_IDS
const DEFAULT_ORIGIN = BUILD_ORIGIN || 'http://127.0.0.1:8897'
const CUSTOMER_CONSENT_KEY = 'xbl_customer_consent_v2'
const CUSTOMER_CONSENT_VERSION = '2026-08-13'
const CUSTOMER_AUTH_ROUTE = 'pages/auth/login'
const STORE_AUTH_ROUTE = 'pagesStore/login/login'
const SALES_AUTH_ROUTE = 'pagesSales/login/login'
let customerAuthOpenPending = false
let customerSessionAuthenticated = false
let authorizationInterceptorsInstalled = false
let storeSessionResolver = () => false
let salesSessionResolver = () => false

export function apiOrigin() {
	try {
		return String(uni.getStorageSync('xbl_api_origin') || DEFAULT_ORIGIN).replace(/\/$/, '')
	} catch (e) {
		return DEFAULT_ORIGIN
	}
}

export function apiAvailable() {
	return typeof uni !== 'undefined' && typeof uni.request === 'function'
}

export function shouldUseWechatLogin() {
	if (String(BUILD_WECHAT_LOGIN).toLowerCase() === 'true') return true
	try { return uni.getStorageSync('xbl_use_wechat_login') === '1' } catch (e) { return false }
}

export function hasCustomerConsent() {
	try { return uni.getStorageSync(CUSTOMER_CONSENT_KEY) === CUSTOMER_CONSENT_VERSION } catch (e) { return false }
}

export function grantCustomerConsent() {
	try { uni.setStorageSync(CUSTOMER_CONSENT_KEY, CUSTOMER_CONSENT_VERSION) } catch (e) {}
}

export function revokeCustomerConsent() {
	try { uni.removeStorageSync(CUSTOMER_CONSENT_KEY) } catch (e) {}
}

export function hasCustomerSession() {
	return customerSessionAuthenticated
}

export function grantCustomerSession() {
	customerSessionAuthenticated = true
}

export function clearCustomerSession() {
	customerSessionAuthenticated = false
}

function normalizeRoute(value) {
	return String(value || '').split('?')[0].replace(/^\//, '')
}

function currentRoute() {
	try {
		const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
		if (pages.length) return normalizeRoute(pages[pages.length - 1].route)
		if (typeof uni !== 'undefined' && typeof uni.getLaunchOptionsSync === 'function') {
			return normalizeRoute(uni.getLaunchOptionsSync().path)
		}
	} catch (e) {}
	return ''
}

// 只有门店端 / 销售端这两个分包是「凭账号密码进入的工作台」，才做路由级拦截。
// 顾客端一律放行：微信要求用户先浏览体验功能服务，再自行选择是否授权登录，
// 所以顾客端的登录判断全部下沉到具体动作（兑奖、查看我的奖品）里。
function authorizationRedirect(route) {
	const target = normalizeRoute(route)
	if (target.startsWith('pagesStore/')) {
		if (target === STORE_AUTH_ROUTE || storeSessionResolver()) return ''
		return '/' + STORE_AUTH_ROUTE
	}
	if (target.startsWith('pagesSales/')) {
		if (target === SALES_AUTH_ROUTE || salesSessionResolver()) return ''
		return '/' + SALES_AUTH_ROUTE
	}
	return ''
}

function redirectToAuthorization(url) {
	if (!url) return
	setTimeout(() => { uni.reLaunch({ url }) }, 0)
}

export function installAuthorizationInterceptors(hasStoreSession, hasSalesSession) {
	storeSessionResolver = typeof hasStoreSession === 'function' ? hasStoreSession : () => false
	salesSessionResolver = typeof hasSalesSession === 'function' ? hasSalesSession : () => false
	if (authorizationInterceptorsInstalled || typeof uni === 'undefined' || typeof uni.addInterceptor !== 'function') return
	authorizationInterceptorsInstalled = true
	;['navigateTo', 'redirectTo', 'reLaunch', 'switchTab'].forEach(method => {
		uni.addInterceptor(method, {
			invoke(args = {}) {
				const redirect = authorizationRedirect(args.url)
				if (!redirect) return true
				redirectToAuthorization(redirect)
				return false
			}
		})
	})
}

// 顾客端唯一的登录入口：用户主动点了「兑奖 / 我的奖品 / 登录」才走到这里，
// 用 navigateTo 打开，登录页可以直接返回原页面，不会把人锁在登录墙里。
export function requireCustomerLogin(options = {}) {
	// 不在这里重复判断登录态：调用方已经用 store.isCustomerAuthenticated() 判过，
	// 在这里再拿会话标记卡一道，会在两者不一致时变成“点了没反应”。
	if (typeof uni === 'undefined' || typeof uni.navigateTo !== 'function') return true
	if (currentRoute() === CUSTOMER_AUTH_ROUTE || customerAuthOpenPending) return true
	customerAuthOpenPending = true
	const query = options.reason ? '?reason=' + encodeURIComponent(options.reason) : ''
	uni.navigateTo({
		url: '/pages/auth/login' + query,
		complete: () => { customerAuthOpenPending = false }
	})
	return true
}

export function requestNotificationPermission() {
	const ids = String(BUILD_TEMPLATE_IDS || '').split(',').map(id => id.trim()).filter(Boolean).slice(0, 3)
	if (!ids.length || typeof uni === 'undefined' || typeof uni.requestSubscribeMessage !== 'function') return Promise.resolve(false)
	return new Promise(resolve => uni.requestSubscribeMessage({ tmplIds: ids, complete: () => resolve(true) }))
}

export function request(path, options = {}, token = '') {
	if (!apiAvailable()) return Promise.reject(Object.assign(new Error('当前运行环境不支持网络请求'), { code: 'ERR_OFFLINE' }))
	return new Promise((resolve, reject) => {
		uni.request({
			url: apiOrigin() + '/api' + path,
			method: options.method || 'GET',
			data: options.data,
			timeout: options.timeout || 10000,
			header: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: 'Bearer ' + token } : {})
			},
			success(res) {
				const payload = res.data || {}
				if (res.statusCode >= 200 && res.statusCode < 300 && payload.ok !== false) {
					resolve(payload.data)
					return
				}
				const error = new Error(payload.error && payload.error.message || '服务请求失败（' + res.statusCode + '）')
				error.code = payload.error && payload.error.code || 'ERR_HTTP'
				error.status = res.statusCode
				reject(error)
			},
			fail(error) {
				const wrapped = new Error(error && error.errMsg || '无法连接业务服务')
				wrapped.code = 'ERR_NETWORK'
				reject(wrapped)
			}
		})
	})
}

export async function download(path, filename, token = '') {
	const url = apiOrigin() + '/api' + path
	if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		const response = await fetch(url, { headers: token ? { Authorization: 'Bearer ' + token } : {} })
		if (!response.ok) throw new Error('报表导出失败')
		const blob = await response.blob()
		const href = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = href
		link.download = filename
		link.click()
		URL.revokeObjectURL(href)
		return true
	}
	return new Promise((resolve, reject) => {
		uni.downloadFile({
			url,
			header: token ? { Authorization: 'Bearer ' + token } : {},
			success(result) {
				if (result.statusCode !== 200) { reject(new Error('报表导出失败')); return }
				uni.openDocument({ filePath: result.tempFilePath, fileType: 'xls', showMenu: true, success: () => resolve(true), fail: reject })
			},
			fail: reject
		})
	})
}

// 后端的 /assets/（内置图）与 /uploads/（后台上传）已经提供了全部业务图片。
// 微信小程序主包有 2MB 硬上限，不能再在 static/img 里放一份同名副本
// （那份副本曾经占掉 1.4MB，直接把主包顶穿），所以图片一律走 HTTPS。
// 注意：<image src> 走的是微信的 downloadFile 合法域名，不是 request 合法域名。
export function publicAsset(path) {
	if (!path) return ''
	const value = String(path)
	if (value.startsWith('http://') || value.startsWith('https://')) return value
	if (value.startsWith('/assets/') || value.startsWith('/uploads/')) return apiOrigin() + value
	return value
}

export default { request, download, apiOrigin, apiAvailable, publicAsset, shouldUseWechatLogin, hasCustomerConsent, grantCustomerConsent, revokeCustomerConsent, hasCustomerSession, grantCustomerSession, clearCustomerSession, installAuthorizationInterceptors, requireCustomerLogin, requestNotificationPermission }
