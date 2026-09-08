import { reactive } from 'vue'
import CONFIG from '@/config/defaults.js'
import { todayStart } from '@/utils/date.js'
import {
	apiAvailable,
	clearCustomerSession,
	download,
	hasCustomerSession,
	publicAsset,
	request,
	requestNotificationPermission,
	shouldUseWechatLogin
} from '@/utils/api.js'

const LEGACY_DEMO_STORAGE_KEY = 'xbl_demo_state_v1'
const POOLS = []
const BATCHES = []
const STORES = []
const ACCOUNTS = []
let customerSyncTask = null
let storeSyncTask = null
let publicShowcaseTask = null

function clone(value) {
	return JSON.parse(JSON.stringify(value))
}

function emptyUser() {
	return { id: '', nick: '', phone: '', avatar: '', blocked: false, blockedReason: '' }
}

function emptyStoreStats() {
	return { todayRedeem: 0, todayWin: 0, todayVerify: 0, winRate: 0, totalVerify: 0, pending: 0, totalValue: 0 }
}

function mapCustomer(user = {}) {
	return {
		...emptyUser(),
		...user,
		avatar: publicAsset(user.avatar),
		joinAt: user.joinAt || (user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : '')
	}
}

const state = reactive({
	config: {
		...clone(CONFIG),
		brandLogo: publicAsset(CONFIG.brandLogo),
		productImg: publicAsset(CONFIG.productImg),
		sceneImgs: CONFIG.sceneImgs.map(publicAsset)
	},
	user: emptyUser(),
	remoteAccount: null,
	customerToken: '',
	storeToken: '',
	onlineCustomer: false,
	onlineStore: false,
	connection: 'offline',
	remoteStats: null,
	remoteTrend: [],
	remoteRank: [],
	remoteStaff: [],
	prizes: [],
	records: [],
	logs: [],
	coupons: [],
	notices: [],
	booted: false
})

function normalizeSteps(remoteSteps, fallbackSteps = CONFIG.steps) {
	const preferred = Array.isArray(remoteSteps) && remoteSteps.length ? remoteSteps : fallbackSteps
	const iconFallbacks = ['shopping-bag', 'package', 'message-circle', 'store']
	return preferred.map((item = {}, index) => ({
		icon: item.icon || fallbackSteps[index]?.icon || iconFallbacks[index] || 'check-circle',
		t: item.t || item.title || fallbackSteps[index]?.t || `第 ${index + 1} 步`,
		d: item.d || item.description || fallbackSteps[index]?.d || ''
	}))
}

function mergeConfig(remote = {}) {
	const previous = state.config || CONFIG
	const remoteNotice = remote.notice || {}
	const previousNotice = previous.notice || CONFIG.notice
	const homeBg = remote.homeBg || previous.homeBg || CONFIG.homeBg
	const poster = remote.poster || previous.poster || CONFIG.poster
	const brandLogo = Object.prototype.hasOwnProperty.call(remote, 'brandLogo') ? remote.brandLogo : (previous.brandLogo || CONFIG.brandLogo)
	const productImg = remote.productImg || previous.productImg || CONFIG.productImg
	const ruleBg = remote.ruleBg || previous.ruleBg || CONFIG.ruleBg
	const sceneImgs = remote.sceneImgs || previous.sceneImgs || CONFIG.sceneImgs
	state.config = {
		...clone(CONFIG),
		...previous,
		...remote,
		marquee: remote.marquee || previous.marquee || [],
		steps: normalizeSteps(remote.steps || remote.flow, previous.steps || CONFIG.steps),
		brandLogo: publicAsset(brandLogo),
		homeBg: publicAsset(homeBg),
		poster: publicAsset(poster),
		productImg: publicAsset(productImg),
		ruleBg: publicAsset(ruleBg),
		sceneImgs: sceneImgs.map(publicAsset),
		notice: {
			...CONFIG.notice,
			...previousNotice,
			...remoteNotice,
			image: publicAsset(Object.prototype.hasOwnProperty.call(remoteNotice, 'image') ? remoteNotice.image : previousNotice.image),
			on: remoteNotice.on != null
				? Boolean(remoteNotice.on)
				: Boolean(remoteNotice.enabled != null ? remoteNotice.enabled : previousNotice.on)
		},
		service: { ...CONFIG.service, ...(previous.service || {}), ...(remote.service || {}) }
	}
}

function authenticationError(message = '请先登录后再操作') {
	const error = new Error(message)
	error.code = 'ERR_AUTH_REQUIRED'
	error.status = 401
	return error
}

const store = {
	state,
	CONFIG,
	POOLS,
	BATCHES,
	STORES,
	ACCOUNTS,

	boot() {
		if (state.booted) return
		state.booted = true
		try { uni.removeStorageSync(LEGACY_DEMO_STORAGE_KEY) } catch (e) {}
		state.customerToken = ''
		state.storeToken = ''
		state.remoteAccount = null
		state.onlineCustomer = false
		state.onlineStore = false
		state.connection = 'offline'
		state.user = emptyUser()
		state.prizes = []
		state.records = []
		state.logs = []
		state.coupons = []
		state.notices = []
		POOLS.splice(0)
		BATCHES.splice(0)
		STORES.splice(0)
		ACCOUNTS.splice(0)
		if (apiAvailable()) this.loadPublicShowcase().catch(() => {})
	},

	// 未登录时首页 / 活动规则 / 门店列表要展示的全部内容都来自公开接口，
	// 这样用户不登录也能完整浏览活动、奖品与可核销门店。
	loadPublicShowcase() {
		if (!apiAvailable()) return Promise.reject(new Error('当前运行环境不支持网络请求'))
		if (publicShowcaseTask) return publicShowcaseTask
		publicShowcaseTask = (async () => {
			try {
				// 奖池/奖品是后加的接口，允许单独失败：小程序新包可能比后端先上线，
				// 那时它们会 404。不能因此把活动配置与门店一起拖下水，
				// 否则游客首页会变成一片空白。
				const [config, stores, pools, prizes] = await Promise.all([
					request('/public/config'),
					request('/public/stores'),
					request('/public/pools').catch(() => null),
					request('/public/prizes').catch(() => null)
				])
				mergeConfig(config)
				this.applyStores(stores)
				if (pools) this.applyPools(pools)
				// 已登录时 state.prizes 是带库存的完整奖品库，别被公开视图覆盖回去
				if (prizes && !this.isCustomerAuthenticated() && !this.isStoreAuthenticated()) {
					state.prizes = prizes.map(this.mapPrize)
				}
				state.connection = 'online'
				return true
			} catch (error) {
				if (!this.isCustomerAuthenticated() && !this.isStoreAuthenticated()) state.connection = 'offline'
				throw error
			} finally {
				publicShowcaseTask = null
			}
		})()
		return publicShowcaseTask
	},

	isCustomerAuthenticated() {
		return hasCustomerSession() && Boolean(state.customerToken) && state.onlineCustomer
	},

	isStoreAuthenticated() {
		return Boolean(state.storeToken && state.remoteAccount && state.onlineStore)
	},

	mapRecord(record) {
		return { ...record, prizeImg: publicAsset(record.prizeImg) }
	},

	mapPrize(prize) {
		return {
			...prize,
			img: publicAsset(prize.img),
			total: Number(prize.stock || 0) + Number(prize.sent || 0),
			type: ({ goods: '实物', cash: '现金红包', coupon: '优惠券' })[prize.type] || prize.type
		}
	},

	applyStores(stores) {
		if (!Array.isArray(stores)) return
		const rows = stores.map((item, index) => ({
			...item,
			img: publicAsset(item.img),
			open: item.hours,
			lng: item.longitude,
			lat: item.latitude,
			area: (item.addr || '').split('区')[0] + (String(item.addr || '').includes('区') ? '区' : ''),
			distance: Number((0.6 + index * 1.1).toFixed(1)),
			verified: item.verifiedCount || 0,
			rank: index + 1
		}))
		STORES.splice(0, STORES.length, ...rows)
	},

	applyPools(pools) {
		if (!Array.isArray(pools)) return
		const colors = ['#B8892B', '#2C7256', '#2F6D8C']
		const rows = pools.map((pool, index) => ({ ...pool, tag: pool.tier, color: colors[index % colors.length] }))
		POOLS.splice(0, POOLS.length, ...rows)
	},

	async loginCustomer() {
		if (!apiAvailable()) throw new Error('当前无法连接登录服务，请检查网络后重试')
		if (typeof uni.login !== 'function') {
			throw Object.assign(new Error('当前环境不支持微信登录，请在微信小程序中打开'), { code: 'ERR_WECHAT_LOGIN' })
		}
		if (!shouldUseWechatLogin()) {
			// 构建时没读到 VITE_USE_WECHAT_LOGIN=true。以前这里只说「请使用微信小程序
			// 完成登录」，在真微信里看到这句话完全无从下手，所以直接点破是构建配置问题。
			throw Object.assign(new Error('当前包未开启微信登录：构建时缺少 VITE_USE_WECHAT_LOGIN=true，请确认 槟榔小程序端/.env 存在后重新编译'), { code: 'ERR_WECHAT_LOGIN' })
		}
		this.logoutCustomer(false)
		let login
		try {
			login = await new Promise((resolve, reject) => uni.login({ provider: 'weixin', success: resolve, fail: reject }))
		} catch (error) {
			// uni.login 的 fail 回调给的是 { errMsg }，不是 Error，直接往上抛会丢掉原因
			throw Object.assign(new Error('微信授权未完成：' + ((error && (error.errMsg || error.message)) || '用户取消或微信登录态异常')), { code: 'ERR_WECHAT_AUTH' })
		}
		if (!login || !login.code) throw Object.assign(new Error('微信未返回有效登录凭证，请退出小程序后重试'), { code: 'ERR_WECHAT_AUTH' })
		try {
			const session = await request('/customer/auth/wechat', { method: 'POST', data: { code: login.code } })
			state.customerToken = session.token
			state.user = mapCustomer(session.user)
		} catch (error) {
			this.logoutCustomer(false)
			error.code = error.code || 'ERR_WECHAT_LOGIN'
			throw error
		}
		try {
			await this.syncCustomerRequest()
		} catch (error) {
			// 微信身份已经通过，失败的是随后的数据加载。分开提示，
			// 否则会被误判成「微信登录不进去」。
			this.logoutCustomer(false)
			throw Object.assign(new Error('登录成功但活动数据加载失败：' + (error && error.message || '请稍后重试')), { code: error && error.code || 'ERR_BOOTSTRAP' })
		}
		return state.user
	},

	logoutCustomer(clearSession = true) {
		state.customerToken = ''
		state.onlineCustomer = false
		state.user = emptyUser()
		state.records = []
		state.coupons = []
		state.notices = []
		// 退回游客态后首页仍要有奖品与门店可看；loginCustomer 里的预清理传 false，
		// 不必为此多打一轮公开接口。
		if (clearSession) {
			clearCustomerSession()
			if (apiAvailable()) this.loadPublicShowcase().catch(() => {})
		}
	},

	syncCustomer(options = {}) {
		if (!state.customerToken || !hasCustomerSession()) {
			const error = authenticationError()
			return options.throwOnError ? Promise.reject(error) : Promise.resolve(false)
		}
		if (!customerSyncTask) customerSyncTask = this.syncCustomerRequest().finally(() => { customerSyncTask = null })
		return customerSyncTask.catch(error => options.throwOnError ? Promise.reject(error) : false)
	},

	async syncCustomerRequest() {
		if (!apiAvailable() || !state.customerToken) throw authenticationError()
		try {
			const token = state.customerToken
			const [boot, records, coupons, notices] = await Promise.all([
				request('/customer/bootstrap', {}, token),
				request('/customer/records', {}, token),
				request('/customer/coupons', {}, token),
				request('/customer/notices', {}, token)
			])
			mergeConfig(boot.config)
			state.user = mapCustomer(boot.user)
			state.prizes = (boot.prizes || []).map(this.mapPrize)
			state.records = (records || []).map(this.mapRecord)
			state.coupons = coupons || []
			state.notices = notices || []
			this.applyStores(boot.stores)
			this.applyPools(boot.pools)
			state.onlineCustomer = true
			state.connection = 'online'
			return true
		} catch (error) {
			state.onlineCustomer = false
			state.connection = 'offline'
			if (error.status === 401 || error.code === 'ERR_AUTH') this.logoutCustomer()
			throw error
		}
	},

	async syncStoreData(options = {}) {
		if (!state.storeToken || !state.remoteAccount) {
			const error = authenticationError('请先登录门店账号')
			if (options.throwOnError) throw error
			return false
		}
		if (storeSyncTask) return storeSyncTask
		storeSyncTask = (async () => {
			try {
				const token = state.storeToken
				const [boot, orders, prizes, trend, rank, stores] = await Promise.all([
					request('/store/bootstrap', {}, token),
					request('/store/orders?pageSize=200', {}, token),
					request('/store/prizes', {}, token),
					request('/store/trend', {}, token),
					request('/store/rank', {}, token),
					request('/public/stores')
				])
				let logs = { items: [] }
				let staff = []
				if (state.remoteAccount.role !== 'staff') logs = await request('/store/logs?pageSize=200', {}, token)
				if (state.remoteAccount.role === 'owner') staff = await request('/store/staff', {}, token)
				state.remoteAccount = { ...boot.account, account: boot.account.username, avatar: publicAsset(boot.account.avatar) }
				state.records = (orders.items || []).map(this.mapRecord)
				state.prizes = (prizes || []).map(this.mapPrize)
				this.applyPools(Array.from(new Map((prizes || []).map(item => [item.pool, {
					id: item.pool,
					name: item.poolName || item.pool,
					tier: '',
					status: 'active'
				}])).values()))
				state.logs = (logs.items || []).map(item => ({ ...item, code: item.detail && item.detail.code || '', orderId: item.entityId }))
				state.remoteStats = boot.stats || emptyStoreStats()
				state.remoteTrend = trend || []
				state.remoteRank = (rank || []).map(item => ({ ...item, img: publicAsset(item.img) }))
				state.remoteStaff = (staff || []).map(item => ({ ...item, account: item.username, avatar: publicAsset(item.avatar), joinAt: item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : '' }))
				this.applyStores(stores)
				state.onlineStore = true
				state.connection = 'online'
				return true
			} catch (error) {
				state.onlineStore = false
				if (error.status === 401 || error.code === 'ERR_AUTH') this.logout()
				if (options.throwOnError) throw error
				return false
			} finally {
				storeSyncTask = null
			}
		})()
		return storeSyncTask
	},

	syncActive() {
		if (this.isStoreAuthenticated()) return this.syncStoreData()
		if (this.isCustomerAuthenticated()) return this.syncCustomer()
		// 游客态也要刷新：活动配置、奖品陈列和门店都可能被总部后台改过
		return this.loadPublicShowcase().catch(() => false)
	},

	requestNotifications() {
		return requestNotificationPermission()
	},

	async readNotice(id) {
		if (!this.isCustomerAuthenticated()) throw authenticationError()
		await request('/customer/notices/' + id + '/read', { method: 'PATCH', data: {} }, state.customerToken)
		const notice = state.notices.find(item => item.id === id)
		if (notice) notice.read = true
		return true
	},

	async readAllNotice() {
		if (!this.isCustomerAuthenticated()) throw authenticationError()
		await request('/customer/notices/read-all', { method: 'PATCH', data: {} }, state.customerToken)
		state.notices.forEach(item => { item.read = true })
		return true
	},

	async redeem(input) {
		if (!this.isCustomerAuthenticated()) return { ok: false, code: 'ERR_AUTH_REQUIRED', msg: '请先登录后再兑换' }
		const code = String(input || '').toUpperCase().trim()
		try {
			const result = await request('/customer/redeem', { method: 'POST', data: { code, preferredStoreId: STORES[0] && STORES[0].id } }, state.customerToken)
			result.record = this.mapRecord(result.record)
			state.records.unshift(result.record)
			this.syncCustomer().catch(() => {})
			return result
		} catch (error) {
			if (error.status === 401) this.logoutCustomer()
			return { ok: false, code: error.code || 'ERR_NETWORK', msg: error.message }
		}
	},

	async changePreferStore(recordId, storeId) {
		if (!this.isCustomerAuthenticated()) throw authenticationError()
		const record = await request('/customer/records/' + recordId + '/preferred-store', { method: 'PATCH', data: { storeId } }, state.customerToken)
		const index = state.records.findIndex(item => item.id === recordId)
		if (index >= 0) state.records.splice(index, 1, this.mapRecord(record))
		return record
	},

	async refreshCustomerRecord(recordId) {
		if (!this.isCustomerAuthenticated()) throw authenticationError()
		const key = String(recordId || '').trim()
		if (!key) throw new Error('兑奖记录编号不能为空')
		const record = this.mapRecord(await request('/customer/records/' + encodeURIComponent(key) + '?refresh=' + Date.now(), {}, state.customerToken))
		const index = state.records.findIndex(item => item.id === record.id || item.code === record.code)
		if (index >= 0) state.records.splice(index, 1, record)
		else state.records.unshift(record)
		return record
	},

	async loginCredentials(username, password) {
		if (!apiAvailable()) throw new Error('当前无法连接门店登录服务')
		this.logout()
		try {
			const session = await request('/store/auth/login', { method: 'POST', data: { username, password } })
			state.storeToken = session.token
			state.remoteAccount = { ...session.account, account: session.account.username, avatar: publicAsset(session.account.avatar) }
			await this.syncStoreData({ throwOnError: true })
			return state.remoteAccount
		} catch (error) {
			this.logout()
			throw error
		}
	},

	logout() {
		state.storeToken = ''
		state.remoteAccount = null
		state.onlineStore = false
		state.remoteStats = null
		state.remoteTrend = []
		state.remoteRank = []
		state.remoteStaff = []
		state.records = []
		state.logs = []
	},

	async findForVerify(input) {
		if (!this.isStoreAuthenticated()) return { ok: false, code: 'ERR_AUTH_REQUIRED', msg: '请先登录门店账号' }
		const code = String(input || '').toUpperCase().trim()
		try {
			const result = await request('/store/orders/' + code + '/verify-preview', {}, state.storeToken)
			return { ...result, record: this.mapRecord(result.record) }
		} catch (error) {
			return { ok: false, code: error.code || 'ERR_NETWORK', msg: error.message }
		}
	},

	async verify(input) {
		if (!this.isStoreAuthenticated()) return { ok: false, code: 'ERR_AUTH_REQUIRED', msg: '请先登录门店账号' }
		const code = String(input || '').toUpperCase().trim()
		const currentStore = this.myStore()
		try {
			const result = await request('/store/orders/' + code + '/verify', {
				method: 'POST',
				data: { position: currentStore ? currentStore.addr + '（门店定位）' : '总部核销工作台' }
			}, state.storeToken)
			result.record = this.mapRecord(result.record)
			const index = state.records.findIndex(item => item.id === result.record.id)
			if (index >= 0) state.records.splice(index, 1, result.record)
			this.syncStoreData().catch(() => {})
			return result
		} catch (error) {
			return { ok: false, code: error.code || 'ERR_NETWORK', msg: error.message }
		}
	},

	staffList() {
		return state.remoteStaff
	},

	async createStaff(body) {
		if (!this.isStoreAuthenticated()) throw authenticationError('请先登录门店账号')
		const account = await request('/store/staff', { method: 'POST', data: body }, state.storeToken)
		const item = { ...account, account: account.username, avatar: publicAsset(account.avatar), joinAt: new Date(account.createdAt).toISOString().slice(0, 10) }
		state.remoteStaff.push(item)
		return item
	},

	async updateStaff(id, body) {
		if (!this.isStoreAuthenticated()) throw authenticationError('请先登录门店账号')
		const account = await request('/store/staff/' + id, { method: 'PATCH', data: body }, state.storeToken)
		const item = { ...account, account: account.username, avatar: publicAsset(account.avatar), joinAt: new Date(account.createdAt).toISOString().slice(0, 10) }
		const index = state.remoteStaff.findIndex(entry => entry.id === id)
		if (index >= 0) state.remoteStaff.splice(index, 1, item)
		return item
	},

	exportStoreOrders() {
		if (!this.isStoreAuthenticated()) return Promise.reject(authenticationError('请先登录门店账号'))
		const currentStore = this.myStore()
		return download('/store/orders/export', (currentStore ? currentStore.short : '全平台') + '-兑奖订单.xls', state.storeToken)
	},

	prizeById(id) { return state.prizes.find(item => item.id === id) },
	poolById(id) { return POOLS.find(item => item.id === id) },
	storeById(id) { return STORES.find(item => item.id === id) },
	recordById(id) { return state.records.find(item => item.id === id) },
	recordByCode(code) { return state.records.find(item => item.code === String(code || '').toUpperCase()) },

	tickExpire() {},

	myRecords() {
		return state.records.slice().sort((a, b) => b.redeemAt - a.redeemAt)
	},
	myRedeemList() { return this.myRecords() },
	myPrizeList(filter) {
		const list = this.myRecords().filter(item => item.win)
		return !filter || filter === 'all' ? list : list.filter(item => item.status === filter)
	},
	myPendingCount() { return this.myRecords().filter(item => item.status === 'pending').length },
	todayRedeemCount() { return this.myRecords().filter(item => item.redeemAt >= todayStart()).length },
	todayLeft() {
		const limit = Number(state.config.dailyLimit || 0)
		return limit <= 0 ? null : Math.max(0, limit - this.todayRedeemCount())
	},
	unreadNotice() { return state.notices.filter(item => !item.read).length },
	validCoupons() { return state.coupons.filter(item => !item.used && item.expireAt > Date.now()) },

	account() { return state.remoteAccount },
	role() { return state.remoteAccount ? state.remoteAccount.role : '' },
	myStore() {
		const account = this.account()
		return account && account.role !== 'hq' ? this.storeById(account.storeId) : null
	},
	canViewData() { return this.role() === 'owner' || this.role() === 'hq' },
	storeOrders(status) {
		let list = state.records.filter(item => item.win)
		if (status && status !== 'all') list = list.filter(item => item.status === status)
		return list.sort((a, b) => (b.verifyAt || b.redeemAt) - (a.verifyAt || a.redeemAt))
	},
	storePendingCount() { return this.storeOrders('pending').length },
	storeLogs() { return state.logs },
	storeStats() { return state.remoteStats || emptyStoreStats() },
	weekTrend() { return state.remoteTrend },
	storeRank() { return state.remoteRank },
	prizeLib() { return state.prizes.slice().sort((a, b) => b.value - a.value) }
}

export default store
