<template>
	<view class="qr" :style="'width:' + px + 'rpx;height:' + px + 'rpx;padding:' + quiet + 'rpx'">
		<view class="qr-in">
			<view v-for="(row, ri) in rows" :key="ri" class="qr-row" :style="'height:' + cell + 'rpx'">
				<view v-for="(seg, si) in row" :key="si" class="qr-seg"
					:style="'width:' + (seg.n * cell) + 'rpx;background:' + (seg.d ? color : 'transparent')"></view>
			</view>
		</view>
	</view>
</template>

<script>
	import { qrMatrix } from '@/utils/qr.js'

	export default {
		name: 'bl-qr',
		props: {
			value: { type: String, required: true },
			/* 二维码整体边长（含静区），单位 rpx */
			size: { type: Number, default: 380 },
			color: { type: String, default: '#0E3B2E' }
		},
		data() {
			return { matrix: null }
		},
		computed: {
			px() {
				return this.size
			},
			mods() {
				return this.matrix ? this.matrix.size : 21
			},
			/* 静区留 3 个模块，扫码识别率更稳 */
			cell() {
				return this.size / (this.mods + 6)
			},
			quiet() {
				return this.cell * 3
			},
			/* 把每行压成连续同色段，减少小程序节点数 */
			rows() {
				if (!this.matrix) return []
				return this.matrix.modules.map(line => {
					const segs = []
					let cur = line[0]
					let n = 0
					for (let i = 0; i < line.length; i++) {
						if (line[i] === cur) n++
						else {
							segs.push({ d: cur === 1, n })
							cur = line[i]
							n = 1
						}
					}
					segs.push({ d: cur === 1, n })
					return segs
				})
			}
		},
		watch: {
			value: {
				immediate: true,
				handler(v) {
					this.matrix = v ? qrMatrix(v) : null
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.qr {
		background: #fff;
		box-sizing: border-box;
	}

	.qr-in {
		width: 100%;
		height: 100%;
	}

	.qr-row {
		display: flex;
		flex-direction: row;
	}

	.qr-seg {
		height: 100%;
	}
</style>
