/**
 * 极简 QR 码编码器（字节模式 / 纠错等级 M / 版本 1~4）
 *
 * 为什么自己写：小程序里画二维码要么依赖 canvas + 三方库，要么走服务端；
 * 这里核销凭证必须离线可用、且要真的能被扫码枪和微信扫出来，所以直接实现标准编码，
 * 输出 0/1 矩阵交给页面用 view 渲染。
 *
 * 用法： const m = qrMatrix('JLJ-JL8K2M')   // m.size, m.modules[row][col]
 */

/* ---------------- GF(256) ---------------- */
const EXP = new Array(512)
const LOG = new Array(256)
;(function initGF() {
	let x = 1
	for (let i = 0; i < 255; i++) {
		EXP[i] = x
		LOG[x] = i
		x <<= 1
		if (x & 0x100) x ^= 0x11d
	}
	for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

function gmul(a, b) {
	if (a === 0 || b === 0) return 0
	return EXP[LOG[a] + LOG[b]]
}

/* 生成多项式 */
function rsPoly(n) {
	let poly = [1]
	for (let i = 0; i < n; i++) {
		const next = new Array(poly.length + 1).fill(0)
		for (let j = 0; j < poly.length; j++) {
			next[j] ^= poly[j]
			next[j + 1] ^= gmul(poly[j], EXP[i])
		}
		poly = next
	}
	return poly
}

function rsEncode(data, ecLen) {
	const gen = rsPoly(ecLen)
	const res = new Array(ecLen).fill(0)
	for (let i = 0; i < data.length; i++) {
		const factor = data[i] ^ res[0]
		res.shift()
		res.push(0)
		if (factor !== 0) {
			for (let j = 0; j < ecLen; j++) {
				res[j] ^= gmul(gen[j + 1], factor)
			}
		}
	}
	return res
}

/* ---------------- 版本参数（纠错等级 M） ---------------- */
const VERSIONS = {
	1: { ec: 10, blocks: [[1, 16]], align: [], cap: 14 },
	2: { ec: 16, blocks: [[1, 28]], align: [6, 18], cap: 26 },
	3: { ec: 26, blocks: [[1, 44]], align: [6, 22], cap: 42 },
	4: { ec: 18, blocks: [[2, 32]], align: [6, 26], cap: 62 }
}

function pickVersion(len) {
	for (let v = 1; v <= 4; v++) {
		if (len <= VERSIONS[v].cap) return v
	}
	return 0
}

/* ---------------- 位流 ---------------- */
function BitBuf() {
	this.bits = []
}
BitBuf.prototype.put = function (val, len) {
	for (let i = len - 1; i >= 0; i--) this.bits.push((val >>> i) & 1)
}

/* UTF-8 编码（核销码是 ASCII，这里顺手支持中文） */
function utf8Bytes(str) {
	const out = []
	for (let i = 0; i < str.length; i++) {
		let c = str.charCodeAt(i)
		if (c < 0x80) out.push(c)
		else if (c < 0x800) {
			out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
		} else {
			out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
		}
	}
	return out
}

/* ---------------- 主流程 ---------------- */
export function qrMatrix(text, forceMask) {
	const bytes = utf8Bytes(String(text))
	const ver = pickVersion(bytes.length)
	if (!ver) return null
	const cfg = VERSIONS[ver]
	const size = 17 + ver * 4

	/* 1. 数据码字 */
	const totalData = cfg.blocks.reduce((s, b) => s + b[0] * b[1], 0)
	const buf = new BitBuf()
	buf.put(4, 4) // 字节模式
	buf.put(bytes.length, 8) // 版本 1~9 的字符计数位宽
	bytes.forEach(b => buf.put(b, 8))
	const capBits = totalData * 8
	for (let i = 0; i < 4 && buf.bits.length < capBits; i++) buf.bits.push(0) // 结束符
	while (buf.bits.length % 8 !== 0) buf.bits.push(0)
	const codewords = []
	for (let i = 0; i < buf.bits.length; i += 8) {
		let v = 0
		for (let j = 0; j < 8; j++) v = (v << 1) | buf.bits[i + j]
		codewords.push(v)
	}
	const PAD = [0xec, 0x11]
	let pi = 0
	while (codewords.length < totalData) codewords.push(PAD[pi++ % 2])

	/* 2. 分块 + 纠错 + 交错 */
	const dataBlocks = []
	const ecBlocks = []
	let off = 0
	cfg.blocks.forEach(([count, dataLen]) => {
		for (let i = 0; i < count; i++) {
			const d = codewords.slice(off, off + dataLen)
			off += dataLen
			dataBlocks.push(d)
			ecBlocks.push(rsEncode(d, cfg.ec))
		}
	})
	const finalBytes = []
	const maxData = Math.max(...dataBlocks.map(b => b.length))
	for (let i = 0; i < maxData; i++) {
		dataBlocks.forEach(b => {
			if (i < b.length) finalBytes.push(b[i])
		})
	}
	for (let i = 0; i < cfg.ec; i++) {
		ecBlocks.forEach(b => finalBytes.push(b[i]))
	}

	/* 3. 矩阵骨架 */
	const mod = []
	const fixed = []
	for (let r = 0; r < size; r++) {
		mod.push(new Array(size).fill(0))
		fixed.push(new Array(size).fill(false))
	}
	const set = (r, c, v) => {
		mod[r][c] = v ? 1 : 0
		fixed[r][c] = true
	}

	/* 定位图案 + 分隔符 */
	function finder(r0, c0) {
		for (let r = -1; r <= 7; r++) {
			for (let c = -1; c <= 7; c++) {
				const rr = r0 + r
				const cc = c0 + c
				if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
				const on =
					(r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
					(c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
					(r >= 2 && r <= 4 && c >= 2 && c <= 4)
				set(rr, cc, on)
			}
		}
	}
	finder(0, 0)
	finder(0, size - 7)
	finder(size - 7, 0)

	/* 定时图案 */
	for (let i = 8; i < size - 8; i++) {
		set(6, i, i % 2 === 0)
		set(i, 6, i % 2 === 0)
	}

	/* 校正图案 */
	const al = cfg.align
	for (let i = 0; i < al.length; i++) {
		for (let j = 0; j < al.length; j++) {
			const r0 = al[i]
			const c0 = al[j]
			if ((r0 === 6 && c0 === 6) ||
				(r0 === 6 && c0 === size - 7) ||
				(r0 === size - 7 && c0 === 6)) continue
			for (let r = -2; r <= 2; r++) {
				for (let c = -2; c <= 2; c++) {
					set(r0 + r, c0 + c,
						Math.max(Math.abs(r), Math.abs(c)) !== 1)
				}
			}
		}
	}

	/* 格式信息区占位 + 固定的深色模块 */
	for (let i = 0; i < 9; i++) {
		if (!fixed[8][i]) set(8, i, 0)
		if (!fixed[i][8]) set(i, 8, 0)
	}
	for (let i = 0; i < 8; i++) {
		if (!fixed[8][size - 1 - i]) set(8, size - 1 - i, 0)
		if (!fixed[size - 1 - i][8]) set(size - 1 - i, 8, 0)
	}
	set(size - 8, 8, 1)

	/* 4. 数据填充（之字形，跳过第 6 列） */
	const bits = []
	finalBytes.forEach(b => {
		for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1)
	})
	let idx = 0
	let up = true
	for (let col = size - 1; col > 0; col -= 2) {
		if (col === 6) col--
		for (let i = 0; i < size; i++) {
			const row = up ? size - 1 - i : i
			for (let k = 0; k < 2; k++) {
				const c = col - k
				if (fixed[row][c]) continue
				mod[row][c] = idx < bits.length ? bits[idx] : 0
				idx++
			}
		}
		up = !up
	}

	/* 5. 选掩码 */
	const maskFn = [
		(r, c) => (r + c) % 2 === 0,
		(r, c) => r % 2 === 0,
		(r, c) => c % 3 === 0,
		(r, c) => (r + c) % 3 === 0,
		(r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
		(r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
		(r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
		(r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
	]

	function applyMask(m, src) {
		const out = src.map(row => row.slice())
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				if (!fixed[r][c] && maskFn[m](r, c)) out[r][c] ^= 1
			}
		}
		return out
	}

	function putFormat(m, target) {
		/* 纠错等级 M = 0b00 */
		const data = (0 << 3) | m
		let rem = data
		for (let i = 0; i < 10; i++) {
			rem = (rem << 1) ^ ((rem >> 9) * 0x537)
		}
		const fmt = (((data << 10) | rem) ^ 0x5412) & 0x7fff
		const bit = i => (fmt >> i) & 1
		/* 第一份：左上角，沿第 8 列自上而下 + 第 8 行自右向左 */
		for (let i = 0; i <= 5; i++) target[i][8] = bit(i)
		target[7][8] = bit(6)
		target[8][8] = bit(7)
		target[8][7] = bit(8)
		for (let i = 9; i <= 14; i++) target[8][14 - i] = bit(i)
		/* 第二份：右上角第 8 行 + 左下角第 8 列 */
		for (let i = 0; i <= 7; i++) target[8][size - 1 - i] = bit(i)
		for (let i = 8; i <= 14; i++) target[size - 15 + i][8] = bit(i)
		target[size - 8][8] = 1
	}

	function penalty(m) {
		let score = 0
		/* 规则 1：同色连续 */
		for (let r = 0; r < size; r++) {
			let run = 1
			for (let c = 1; c < size; c++) {
				if (m[r][c] === m[r][c - 1]) run++
				else {
					if (run >= 5) score += 3 + (run - 5)
					run = 1
				}
			}
			if (run >= 5) score += 3 + (run - 5)
		}
		for (let c = 0; c < size; c++) {
			let run = 1
			for (let r = 1; r < size; r++) {
				if (m[r][c] === m[r - 1][c]) run++
				else {
					if (run >= 5) score += 3 + (run - 5)
					run = 1
				}
			}
			if (run >= 5) score += 3 + (run - 5)
		}
		/* 规则 2：2×2 同色 */
		for (let r = 0; r < size - 1; r++) {
			for (let c = 0; c < size - 1; c++) {
				const v = m[r][c]
				if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3
			}
		}
		/* 规则 3：类定位图案 */
		const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]
		const pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]
		const match = (arr, pat) => pat.every((p, i) => arr[i] === p)
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size - 10; c++) {
				const seg = m[r].slice(c, c + 11)
				if (match(seg, pat1) || match(seg, pat2)) score += 40
			}
		}
		for (let c = 0; c < size; c++) {
			for (let r = 0; r < size - 10; r++) {
				const seg = []
				for (let k = 0; k < 11; k++) seg.push(m[r + k][c])
				if (match(seg, pat1) || match(seg, pat2)) score += 40
			}
		}
		/* 规则 4：深色比例 */
		let dark = 0
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) dark += m[r][c]
		}
		const pct = (dark * 100) / (size * size)
		score += Math.floor(Math.abs(pct - 50) / 5) * 10
		return score
	}

	let best = null
	let bestScore = Infinity
	let bestMask = 0
	for (let m = 0; m < 8; m++) {
		const cand = applyMask(m, mod)
		putFormat(m, cand)
		/* forceMask 只给自检脚本用（scripts/check-qr.mjs），业务侧不传 */
		if (typeof forceMask === 'number') {
			if (m === forceMask) return { size, modules: cand, version: ver, mask: m }
			continue
		}
		const s = penalty(cand)
		if (s < bestScore) {
			bestScore = s
			best = cand
			bestMask = m
		}
	}

	return { size, modules: best, version: ver, mask: bestMask }
}

export default qrMatrix
