import { reactive } from 'vue'
import { request } from '@/utils/api.js'

const TOKEN_KEY = 'xbl_sales_token_v1'
const USER_KEY = 'xbl_sales_user_v1'

const state = reactive({ token: '', user: null, stores: [], booted: false })

function read(key, fallback = '') {
	try { return uni.getStorageSync(key) || fallback } catch (error) { return fallback }
}

function write(key, value) {
	try {
		if (value) uni.setStorageSync(key, value)
		else uni.removeStorageSync(key)
	} catch (error) {}
}

function clear() {
	state.token = ''
	state.user = null
	state.stores = []
	write(TOKEN_KEY, '')
	write(USER_KEY, '')
}

async function authed(path, options = {}) {
	if (!state.token) throw new Error('请先登录销售账号')
	try {
		return await request(path, options, state.token)
	} catch (error) {
		if (error.status === 401 || error.status === 403) clear()
		throw error
	}
}

const salesStore = {
	state,
	boot() {
		if (state.booted) return
		state.booted = true
		state.token = String(read(TOKEN_KEY, ''))
		try { state.user = JSON.parse(read(USER_KEY, 'null')) } catch (error) { state.user = null }
		if (!state.token || state.user?.role !== 'sales') clear()
	},
	authenticated() { return Boolean(state.token && state.user?.role === 'sales') },
	async login(username, password) {
		const session = await request('/admin/auth/login', { method: 'POST', data: { username, password } })
		if (session.user?.role !== 'sales') throw new Error('该账号不是公司销售账号，请使用销售账号登录')
		state.token = session.token
		state.user = session.user
		write(TOKEN_KEY, state.token)
		write(USER_KEY, JSON.stringify(state.user))
		await this.loadStores()
		return state.user
	},
	logout: clear,
	async loadStores() {
		state.stores = await authed('/admin/stores')
		return state.stores
	},
	store(id) { return state.stores.find(item => item.id === id) || null },
	async saveStore(id, body) {
		const saved = await authed('/admin/stores' + (id ? '/' + encodeURIComponent(id) : ''), {
			method: id ? 'PUT' : 'POST',
			data: body
		})
		await this.loadStores()
		return saved
	},
	async deleteStore(id) {
		await authed('/admin/stores/' + encodeURIComponent(id), { method: 'DELETE' })
		await this.loadStores()
	},
	accounts(storeId) { return authed('/admin/stores/' + encodeURIComponent(storeId) + '/accounts') },
	createAccount(storeId, body) {
		return authed('/admin/stores/' + encodeURIComponent(storeId) + '/accounts', { method: 'POST', data: body })
	}
}

export default salesStore
