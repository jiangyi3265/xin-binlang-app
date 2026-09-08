<template>
	<image class="bl-icon" :style="wrapStyle" :src="src" mode="scaleToFill" />
</template>

<script>
	import ICONS from './icons.js'

	const B64CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

	/* SVG 全是 ASCII，用最小实现做 base64，避免依赖 btoa（小程序没有） */
	function toBase64(str) {
		let out = ''
		let i = 0
		while (i < str.length) {
			const c1 = str.charCodeAt(i++) & 0xff
			const c2 = i <= str.length - 1 ? str.charCodeAt(i++) & 0xff : NaN
			const c3 = i <= str.length - 1 ? str.charCodeAt(i++) & 0xff : NaN
			out += B64CHARS.charAt(c1 >> 2)
			if (isNaN(c2)) {
				out += B64CHARS.charAt((c1 & 3) << 4) + '=='
				break
			}
			out += B64CHARS.charAt(((c1 & 3) << 4) | (c2 >> 4))
			if (isNaN(c3)) {
				out += B64CHARS.charAt((c2 & 15) << 2) + '='
				break
			}
			out += B64CHARS.charAt(((c2 & 15) << 2) | (c3 >> 6)) + B64CHARS.charAt(c3 & 63)
		}
		return out
	}

	const cache = {}

	function buildIcon(name, color, weight, fill) {
		const key = name + '|' + color + '|' + weight + '|' + (fill ? 1 : 0)
		if (cache[key]) return cache[key]
		const inner = ICONS[name] || ICONS['circle-dot']
		const svg =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="' +
			(fill ? color : 'none') +
			'" stroke="' + color + '" stroke-width="' + weight +
			'" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'
		const uri = 'data:image/svg+xml;base64,' + toBase64(svg)
		cache[key] = uri
		return uri
	}

	export default {
		name: 'bl-icon',
		props: {
			/* 图标名，见 icons.js */
			name: { type: String, required: true },
			/* 尺寸：数字按 rpx 处理，字符串原样使用 */
			size: { type: [Number, String], default: 36 },
			color: { type: String, default: '#16261F' },
			/* 线宽（24 网格下的 stroke-width） */
			weight: { type: [Number, String], default: 1.8 },
			/* 实心 */
			fill: { type: Boolean, default: false }
		},
		computed: {
			src() {
				return buildIcon(this.name, this.color, this.weight, this.fill)
			},
			wrapStyle() {
				const s = typeof this.size === 'number' ? this.size + 'rpx' : this.size
				return 'width:' + s + ';height:' + s + ';'
			}
		}
	}
</script>

<style scoped>
	.bl-icon {
		display: block;
		flex-shrink: 0;
	}
</style>
