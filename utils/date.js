/* 时间工具：小程序端不引三方库，够用就好 */

export const DAY = 86400000
export const HOUR = 3600000

function p2(n) {
	return n < 10 ? '0' + n : '' + n
}

/**
 * fmt(ts, 'YYYY-MM-DD HH:mm')
 * 支持 YYYY / MM / DD / HH / mm / ss / M / D
 */
export function fmt(ts, pattern) {
	if (!ts) return '—'
	const d = new Date(ts)
	const map = {
		YYYY: d.getFullYear(),
		MM: p2(d.getMonth() + 1),
		DD: p2(d.getDate()),
		HH: p2(d.getHours()),
		mm: p2(d.getMinutes()),
		ss: p2(d.getSeconds()),
		M: d.getMonth() + 1,
		D: d.getDate()
	}
	return (pattern || 'YYYY-MM-DD HH:mm').replace(/YYYY|MM|DD|HH|mm|ss|M|D/g, k => map[k])
}

/* 相对时间：刚刚 / 12 分钟前 / 昨天 15:20 / 03-12 */
export function rel(ts) {
	if (!ts) return ''
	const diff = Date.now() - ts
	if (diff < 60000) return '刚刚'
	if (diff < HOUR) return Math.floor(diff / 60000) + ' 分钟前'
	if (diff < DAY && new Date(ts).getDate() === new Date().getDate()) {
		return '今天 ' + fmt(ts, 'HH:mm')
	}
	if (diff < DAY * 2) return '昨天 ' + fmt(ts, 'HH:mm')
	if (new Date(ts).getFullYear() === new Date().getFullYear()) return fmt(ts, 'MM-DD HH:mm')
	return fmt(ts, 'YYYY-MM-DD')
}

/* 距离 ts 还剩多少天（向上取整，最小 0） */
export function daysLeft(ts) {
	const d = Math.ceil((ts - Date.now()) / DAY)
	return d > 0 ? d : 0
}

/* 倒计时拆解：{d,h,m,s,over} */
export function countdown(ts) {
	let left = ts - Date.now()
	const over = left <= 0
	if (over) left = 0
	return {
		over,
		d: Math.floor(left / DAY),
		h: Math.floor((left % DAY) / HOUR),
		m: Math.floor((left % HOUR) / 60000),
		s: Math.floor((left % 60000) / 1000)
	}
}

/* 今天 0 点 */
export function todayStart(ts) {
	const d = new Date(ts || Date.now())
	d.setHours(0, 0, 0, 0)
	return d.getTime()
}

/* 是否同一天 */
export function sameDay(a, b) {
	return todayStart(a) === todayStart(b)
}
