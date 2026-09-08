/**
 * 二维码自检
 *
 *   node scripts/check-qr.mjs
 *
 * utils/qr.js 是自己实现的编码器（核销凭证要离线可扫），所以这里逐项校验结构：
 * 定位图案、分隔符、定时图案、固定深色模块、格式信息回读（纠错等级 + 掩码），
 * 并打印一张 ASCII 预览，肉眼也能确认没画歪。
 *
 * 编码结果曾与 Python 的 qrcode 库逐掩码比对过（8 种掩码全部一致）。
 */
import { qrMatrix } from '../utils/qr.js'

const CASES = [
	'JLJ-D5N2Y6',
	'JLJ-K7M2P4',
	'JLJ-Q2W5E8',
	'JLJ-ZZ0000',
	'JLJ-ORDER-JL202608124201-T9B4X1',
	'x'
]

let bad = 0
function ok(cond, label) {
	if (!cond) { bad++; console.log('  ✗ ' + label) }
	else console.log('  ✓ ' + label)
}

function checkFinder(m, r0, c0, size) {
	for (let r = 0; r < 7; r++) {
		for (let c = 0; c < 7; c++) {
			const want =
				(r === 0 || r === 6 || c === 0 || c === 6) ? 1
					: (r >= 2 && r <= 4 && c >= 2 && c <= 4) ? 1 : 0
			if (m[r0 + r][c0 + c] !== want) return false
		}
	}
	return true
}

CASES.forEach(text => {
	const q = qrMatrix(text)
	console.log('\n「' + text + '」  版本 ' + q.version + ' · ' + q.size + '×' + q.size + ' · 掩码 ' + q.mask)
	const m = q.modules
	const n = q.size

	ok(m.length === n && m.every(r => r.length === n), '矩阵尺寸正确')
	ok(checkFinder(m, 0, 0, n), '左上定位图案')
	ok(checkFinder(m, 0, n - 7, n), '右上定位图案')
	ok(checkFinder(m, n - 7, 0, n), '左下定位图案')

	let timingOk = true
	for (let i = 8; i < n - 8; i++) {
		if (m[6][i] !== (i % 2 === 0 ? 1 : 0)) timingOk = false
		if (m[i][6] !== (i % 2 === 0 ? 1 : 0)) timingOk = false
	}
	ok(timingOk, '横竖定时图案交替正确')
	ok(m[n - 8][8] === 1, '固定深色模块存在')

	/* 回读格式信息：BCH 校验 + 纠错等级 + 掩码 */
	let fmt = 0
	const bits = []
	for (let i = 0; i <= 5; i++) bits[i] = m[i][8]
	bits[6] = m[7][8]
	bits[7] = m[8][8]
	bits[8] = m[8][7]
	for (let i = 9; i <= 14; i++) bits[i] = m[8][14 - i]
	for (let i = 14; i >= 0; i--) fmt = (fmt << 1) | bits[i]

	const raw = fmt ^ 0x5412
	let rem = raw
	for (let i = 14; i >= 10; i--) {
		if ((rem >> i) & 1) rem ^= 0x537 << (i - 10)
	}
	ok(rem === 0, '格式信息 BCH 校验通过')
	ok(((raw >> 13) & 3) === 0, '纠错等级回读为 M')
	ok(((raw >> 10) & 7) === q.mask, '掩码回读与实际使用一致（' + ((raw >> 10) & 7) + '）')

	/* 第二份格式信息应与第一份一致 */
	const b2 = []
	for (let i = 0; i <= 7; i++) b2[i] = m[8][n - 1 - i]
	for (let i = 8; i <= 14; i++) b2[i] = m[n - 15 + i][8]
	ok(b2.every((v, i) => v === bits[i]), '两份格式信息一致')
})

/* ASCII 预览 */
const sample = qrMatrix('JLJ-D5N2Y6')
console.log('\n预览（JLJ-D5N2Y6）：')
const pad = '  ' + '　'.repeat(sample.size + 2)
console.log(pad)
sample.modules.forEach(row => {
	console.log('  　' + row.map(v => (v ? '██' : '　')).join('').replace(/██/g, '█') + '　')
})
console.log(pad)

console.log('\n' + '─'.repeat(46))
if (bad) {
	console.log('✗ ' + bad + ' 项二维码结构校验未通过')
	process.exit(1)
}
console.log('✓ 二维码结构校验全部通过')
