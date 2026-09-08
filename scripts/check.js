/**
 * 工程自检：不跑起来也能查出大部分低级错误
 *
 *   node scripts/check.js
 *
 * 检查项：
 *   1. pages.json 里声明的页面文件是否都存在
 *   2. 代码里所有跳转 URL 是否指向已声明的路由（switchTab 必须是 tabBar 页）
 *   3. <bl-icon name="x"> / icon: 'x' 用到的图标是否都在 icons.js 里
 *   4. 引用的 /static 图片是否真的存在
 *   5. 样式里用到的 $bl-* 变量是否都在 uni.scss 定义过
 *   6. <bl-xxx> 组件是否有对应的组件目录
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const err = []
const warn = []

function read(p) {
	return fs.readFileSync(path.join(ROOT, p), 'utf8')
}

function walk(dir, out) {
	out = out || []
	const abs = path.join(ROOT, dir)
	if (!fs.existsSync(abs)) return out
	fs.readdirSync(abs).forEach(f => {
		const rel = dir + '/' + f
		const st = fs.statSync(path.join(ROOT, rel))
		if (st.isDirectory()) walk(rel, out)
		else out.push(rel)
	})
	return out
}

/* ---------- 1. 路由 ---------- */
const pagesJson = JSON.parse(read('pages.json').replace(/^﻿/, ''))
const routes = new Set()
const tabRoutes = new Set()

/* 微信审核红线：打开小程序必须先能浏览体验功能服务，
   不得一进首页就要求授权登录。下面几项把这条红线钉死。 */
if (!pagesJson.pages.length || pagesJson.pages[0].path !== 'pages/index/index') {
	err.push('[登录] pages/index/index 必须是小程序的首个页面（启动直接进首页）')
}

const appSource = read('App.vue')
if (appSource.includes('guardCustomerAuthorization')) {
	err.push('[登录] App.vue 不得在启动/显示时强制顾客登录跳转')
}

pagesJson.pages.forEach(p => routes.add('/' + p.path))
;(pagesJson.subPackages || []).forEach(sp => {
	sp.pages.forEach(p => routes.add('/' + sp.root + '/' + p.path))
})
;(pagesJson.tabBar ? pagesJson.tabBar.list : []).forEach(t => tabRoutes.add('/' + t.pagePath))

routes.forEach(r => {
	const f = r.slice(1) + '.vue'
	if (!fs.existsSync(path.join(ROOT, f))) err.push('[路由] 页面文件缺失: ' + f)
})
tabRoutes.forEach(r => {
	if (!routes.has(r)) err.push('[路由] tabBar 指向未声明的页面: ' + r)
})

/* tabBar 图标 */
;(pagesJson.tabBar ? pagesJson.tabBar.list : []).forEach(t => {
	;[t.iconPath, t.selectedIconPath].forEach(i => {
		if (i && !fs.existsSync(path.join(ROOT, i))) err.push('[tabBar] 图标缺失: ' + i)
	})
})

/* ---------- 收集源码 ---------- */
const files = []
	.concat(walk('pages'), walk('pagesStore'), walk('pagesSales'), walk('components'), walk('store'), walk('config'), walk('utils'))
	.filter(f => /\.(vue|js)$/.test(f))

/* ---------- 2. 跳转 URL ---------- */
const navRe = /uni\.(navigateTo|redirectTo|reLaunch|switchTab)\(\s*\{\s*url:\s*'([^']+)'/g
files.forEach(f => {
	const src = read(f)
	let m
	while ((m = navRe.exec(src))) {
		const kind = m[1]
		const url = m[2].split('?')[0]
		if (!url.startsWith('/')) continue
		if (!routes.has(url)) err.push('[跳转] ' + f + ' -> ' + url + ' 未在 pages.json 声明')
		else if (kind === 'switchTab' && !tabRoutes.has(url)) {
			err.push('[跳转] ' + f + ' switchTab 指向非 tabBar 页: ' + url)
		} else if (kind !== 'switchTab' && tabRoutes.has(url) && kind === 'navigateTo') {
			err.push('[跳转] ' + f + ' navigateTo 不能跳 tabBar 页: ' + url)
		}
	}
	/* url: '/x' + var 这类拼接 */
	const cat = /url:\s*'(\/[^']*?)\?/g
	while ((m = cat.exec(src))) {
		if (!routes.has(m[1])) err.push('[跳转] ' + f + ' -> ' + m[1] + ' 未在 pages.json 声明')
	}
})

/* ---------- 3. 图标 ---------- */
const iconsSrc = read('components/bl-icon/icons.js')
const iconNames = new Set()
const iconRe = /(?:^\t'([^']+)'|^\t([A-Za-z][\w-]*))\s*:/gm
let im
while ((im = iconRe.exec(iconsSrc))) iconNames.add(im[1] || im[2])

/* uni.showToast 的 icon 字段不是我们的图标库 */
const TOAST_ICONS = ['none', 'success', 'loading', 'error', 'fail', 'exception']
const usedIcons = new Set()
files.forEach(f => {
	const src = read(f)
	let m
	const r1 = /<bl-icon[^>]*?\sname="([^"]+)"/g
	while ((m = r1.exec(src))) usedIcons.add(m[1])
	const r2 = /\bicon:\s*'([a-z][a-z0-9-]*)'/g
	while ((m = r2.exec(src))) usedIcons.add(m[1])
	const r3 = /\bi:\s*'([a-z][a-z0-9-]*)'/g
	while ((m = r3.exec(src))) usedIcons.add(m[1])
})
TOAST_ICONS.forEach(n => usedIcons.delete(n))
usedIcons.forEach(n => {
	if (!iconNames.has(n)) err.push('[图标] icons.js 里没有: ' + n)
})

/* ---------- 4. 图片与主包体积预算 ----------
   微信主包硬上限 2048KB。static/ 整个目录都进主包，曾经在这里放过
   一份 1.4MB 的图片副本，直接导致上传报“代码包大小超过限制”。
   业务图片一律走后端 /assets/ 与 /uploads/，static/ 只留 tabBar 图标与 logo。 */
const STATIC_BUDGET_KB = 128
function dirSizeKb(rel) {
	return walk(rel).reduce((sum, f) => sum + fs.statSync(path.join(ROOT, f)).size, 0) / 1024
}
const staticKb = dirSizeKb('static')
if (staticKb > STATIC_BUDGET_KB) {
	err.push('[体积] static/ 已占 ' + staticKb.toFixed(0) + 'KB，超过预算 ' + STATIC_BUDGET_KB + 'KB；业务图片请走后端 /assets/')
}
if (fs.existsSync(path.join(ROOT, 'static/img'))) {
	err.push('[体积] static/img 已废弃：图片副本会把主包顶出 2048KB 上限')
}


const usedImgs = new Set()
files.forEach(f => {
	const src = read(f)
	const r = /['"](\/static\/[\w./-]+\.(?:jpg|jpeg|png))['"]/g
	let m
	while ((m = r.exec(src))) usedImgs.add(m[1])
})
usedImgs.forEach(p => {
	if (!fs.existsSync(path.join(ROOT, p.slice(1)))) err.push('[图片] 文件不存在: ' + p)
})

/* ---------- 5. SCSS 变量 ---------- */
const scss = read('uni.scss')
const defined = new Set()
let sm
const defRe = /^\$([\w-]+)\s*:/gm
while ((sm = defRe.exec(scss))) defined.add(sm[1])

files.filter(f => f.endsWith('.vue')).forEach(f => {
	const src = read(f)
	const styleIdx = src.indexOf('<style')
	if (styleIdx < 0) return
	const style = src.slice(styleIdx)
	const r = /\$([\w-]+)/g
	let m
	while ((m = r.exec(style))) {
		if (!defined.has(m[1])) err.push('[样式] ' + f + ' 用了未定义变量 $' + m[1])
	}
})

/* ---------- 6. 组件 ---------- */
const usedComp = new Set()
files.filter(f => f.endsWith('.vue')).forEach(f => {
	const src = read(f)
	const r = /<(bl-[\w-]+)[\s/>]/g
	let m
	while ((m = r.exec(src))) usedComp.add(m[1])
})
usedComp.forEach(c => {
	const p = 'components/' + c + '/' + c + '.vue'
	if (!fs.existsSync(path.join(ROOT, p))) err.push('[组件] 找不到: ' + p)
})

/* ---------- 7. store 方法调用 ---------- */
const storeSrc = read('store/index.js')
const storeApi = new Set()
const apiRe = /^\t(?:async\s+)?([a-zA-Z][\w]*)\s*\(/gm
let am
while ((am = apiRe.exec(storeSrc))) storeApi.add(am[1])
;['state', 'CONFIG', 'POOLS', 'BATCHES', 'STORES', 'ACCOUNTS'].forEach(k => storeApi.add(k))

files.forEach(f => {
	const src = read(f)
	const r = /\bstore\.([a-zA-Z][\w]*)\s*\(/g
	let m
	while ((m = r.exec(src))) {
		if (!storeApi.has(m[1])) err.push('[store] ' + f + ' 调用了不存在的方法 store.' + m[1] + '()')
	}
})

/* ---------- 8. 正式环境与登录时机约束 ---------- */
const productionSource = files.map(f => `${f}\n${read(f)}`).join('\n')
const forbidden = [
	['/customer/auth/dev', '消费者端禁止调用测试登录接口'],
	['redeemOffline', '消费者端禁止离线开奖'],
	['verifyOffline', '门店端禁止离线核销'],
	['resetDemo', '正式端禁止演示数据重置'],
	['演示卡密', '正式端禁止展示演示卡密'],
	['模拟扫描', '正式端禁止模拟核销扫码']
]
forbidden.forEach(([needle, message]) => {
	if (productionSource.includes(needle)) err.push('[正式环境] ' + message)
})
const redeemSource = read('pages/redeem/redeem.vue')
if (!redeemSource.includes('store.isCustomerAuthenticated()')) {
	err.push('[登录] 兑奖页缺少当前会话登录校验')
}
if (!redeemSource.includes("requireCustomerLogin({ reason: 'redeem' })")) {
	err.push('[登录] 兑奖页必须在用户提交兑换码时才邀请登录')
}
if (!read('pages/auth/login.vue').includes('skip()')) {
	err.push('[登录] 登录页必须留有“不登录继续浏览”的出口')
}
/* 顾客端任何页面都不准 reLaunch 到登录页 —— 那就是登录墙 */
walk('pages').filter(f => f.endsWith('.vue')).forEach(f => {
	if (read(f).includes("reLaunch({ url: '/pages/auth/login")) {
		err.push('[登录] ' + f + ' 不得用 reLaunch 强制跳转登录页')
	}
})
/* 未登录时个人数据页要给游客态，而不是空白或跳转 */
;[
	['pages/index/index.vue', '首页'],
	['pages/record/record.vue', '兑奖记录'],
	['pages/user/user.vue', '个人中心'],
	['pages/coupon/coupon.vue', '优惠券'],
	['pages/notice/notice.vue', '服务通知']
].forEach(([file, label]) => {
	const src = read(file)
	if (!src.includes('logged()') || !src.includes('v-if="!logged"')) {
		err.push('[登录] ' + label + '页缺少未登录（游客）展示分支')
	}
})
/* 游客也要有真实内容可看：首页奖品/门店/奖池必须有公开接口兵底 */
;["'/public/config'", "'/public/stores'", "'/public/pools'", "'/public/prizes'"].forEach(needle => {
	if (!storeSrc.includes(needle)) {
		err.push('[登录] store 缺少游客可读的公开接口 ' + needle)
	}
})
if (read('pages/auth/login.vue').includes('this.submit(true)')) {
	err.push('[登录] 登录页禁止根据历史授权自动提交登录')
}
if (read('store/index.js').includes("@/mock/")) {
	err.push('[正式环境] 运行时 store 禁止引用 Mock 数据')
}
if (!read('pages/index/index.vue').includes("go('/pagesSales/login/login')") || !read('pagesSales/login/login.vue').includes('salesStore.login')) {
	err.push('[销售端] 小程序缺少销售登录入口或正式登录调用')
}
if (!read('store/sales.js').includes("'/admin/stores'") || !read('pagesSales/accounts/accounts.vue').includes('salesStore.createAccount')) {
	err.push('[销售端] 缺少本人门店读取或门店账号创建功能')
}
const recordDetailSource = read('pages/record/detail.vue')
if (!storeSrc.includes('refreshCustomerRecord(recordId)')) {
	err.push('[状态同步] store 缺少消费者单条凭证刷新方法')
}
if (!recordDetailSource.includes('startStatusPolling()') || !recordDetailSource.includes('refreshRecord(false)')) {
	err.push('[状态同步] 领奖凭证页缺少核销状态自动刷新')
}
if (!recordDetailSource.includes('currentRecord = latest') || !storeSrc.includes("'?refresh=' + Date.now()")) {
	err.push('[状态同步] 领奖凭证页未使用无缓存的服务端结果直接刷新当前凭证')
}
if (!read('pages/record/record.vue').includes('store.syncCustomer()')) {
	err.push('[状态同步] 兑奖记录页显示时未同步服务端状态')
}

/* ---------- 输出 ---------- */
console.log('页面 ' + routes.size + ' 个（tabBar ' + tabRoutes.size + '）')
console.log('图标 ' + iconNames.size + ' 枚，实际用到 ' + usedIcons.size + ' 枚')
console.log('图片 ' + usedImgs.size + ' 张，SCSS 变量 ' + defined.size + ' 个')
console.log('组件 ' + usedComp.size + ' 个，扫描文件 ' + files.length + ' 个')
console.log('')

if (warn.length) {
	warn.forEach(w => console.log('WARN  ' + w))
	console.log('')
}
if (err.length) {
	err.forEach(e => console.log('ERROR ' + e))
	console.log('\n✗ 发现 ' + err.length + ' 个问题')
	process.exit(1)
} else {
	console.log('✓ 全部检查通过')
}
