<template>
	<view class="pg">
		<bl-navbar title="扫码核销" bg="green" :show-back="false" home="/pagesStore/home/home">
			<template #right>
				<view class="nav-r" @tap="go('/pagesStore/input/input')">
					<text>输码</text>
				</view>
			</template>
		</bl-navbar>

		<!-- ============ 取景框 ============ -->
		<view class="cam">
			<image class="cam-bg" :src="camBg" mode="aspectFill" />
			<view class="cam-mask"></view>

			<view class="frame">
				<view class="corner c-tl"></view>
				<view class="corner c-tr"></view>
				<view class="corner c-bl"></view>
				<view class="corner c-br"></view>
				<view class="scanline"></view>
				<view class="frame-ico">
					<bl-icon name="qr-code" :size="120" color="rgba(240,215,154,.28)" :weight="1.2" />
				</view>
			</view>

			<text class="cam-tip">将顾客的领奖凭证二维码放入框内</text>

			<view class="cam-btn bl-btn bl-btn-gold" @tap="realScan">
				<bl-icon name="scan-line" :size="36" color="#3B2A06" :weight="2" />
				<text class="cam-btn-t">调起微信扫一扫</text>
			</view>
		</view>

		<bl-storebar active="scan" />
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { publicAsset } from '@/utils/api.js'

	export default {
		computed: {
			camBg() { return publicAsset('/assets/store-1.jpg') }
		},
		onShow() {
			if (!store.account()) uni.redirectTo({ url: '/pagesStore/login/login' })
		},
		methods: {
			go(url) { uni.navigateTo({ url }) },
			realScan() {
				uni.scanCode({
					scanType: ['qrCode'],
					success: res => {
						const raw = String(res.result || '')
						const code = raw.replace(/^JLJ-/, '').toUpperCase().slice(0, 6)
						this.open(code)
					},
					fail: () => {
						uni.showToast({ title: '未识别到有效二维码，请重试或使用输码核销', icon: 'none' })
					}
				})
			},
			open(code) {
				uni.navigateTo({ url: '/pagesStore/confirm/confirm?code=' + code })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		background: $bl-paper;
	}

	.nav-r {
		padding: 8rpx 18rpx;
		border-radius: $bl-r-sm;
		background: rgba(255, 255, 255, 0.16);

		text {
			font-size: 24rpx;
			color: #FFF6E6;
		}
	}

	/* ============ 取景 ============ */
	.cam {
		position: relative;
		padding: 48rpx $bl-pad 44rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow: hidden;
	}

	.cam-bg {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.cam-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(180deg, rgba(6, 26, 20, 0.95), rgba(10, 43, 33, 0.92));
	}

	.frame {
		position: relative;
		z-index: 2;
		width: 420rpx;
		height: 420rpx;
		border: 1rpx solid rgba(240, 215, 154, 0.16);
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.frame-ico {
		opacity: 0.9;
	}

	.corner {
		position: absolute;
		width: 56rpx;
		height: 56rpx;
		border-color: $bl-gold-2;
		border-style: solid;
		border-width: 0;
	}

	.c-tl {
		left: -1rpx;
		top: -1rpx;
		border-left-width: 6rpx;
		border-top-width: 6rpx;
		border-top-left-radius: $bl-r-md;
	}

	.c-tr {
		right: -1rpx;
		top: -1rpx;
		border-right-width: 6rpx;
		border-top-width: 6rpx;
		border-top-right-radius: $bl-r-md;
	}

	.c-bl {
		left: -1rpx;
		bottom: -1rpx;
		border-left-width: 6rpx;
		border-bottom-width: 6rpx;
		border-bottom-left-radius: $bl-r-md;
	}

	.c-br {
		right: -1rpx;
		bottom: -1rpx;
		border-right-width: 6rpx;
		border-bottom-width: 6rpx;
		border-bottom-right-radius: $bl-r-md;
	}

	.scanline {
		position: absolute;
		left: 10rpx;
		right: 10rpx;
		height: 4rpx;
		background: linear-gradient(90deg, transparent, $bl-gold-2, transparent);
		box-shadow: 0 0 20rpx rgba(217, 169, 74, 0.7);
		animation: scan 2.4s ease-in-out infinite;
	}

	@keyframes scan {
		0% { top: 14rpx; }
		50% { top: 396rpx; }
		100% { top: 14rpx; }
	}

	.cam-tip {
		position: relative;
		z-index: 2;
		margin-top: 30rpx;
		font-size: 24rpx;
		color: rgba(255, 246, 230, 0.7);
	}

	.cam-btn {
		position: relative;
		z-index: 2;
		margin-top: 30rpx;
		width: 100%;
	}

	.cam-btn-t {
		margin-left: 12rpx;
		letter-spacing: 2rpx;
	}

</style>
