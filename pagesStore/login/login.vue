<template>
	<view class="pg">
		<image class="bg" :src="cfg.homeBg" mode="aspectFill" />
		<view class="bg-mask"></view>

		<bl-navbar bg="transparent" title="" :fixed="false" home="/pages/index/index" />

		<view class="wrap">
			<view class="head">
				<image v-if="cfg.brandLogo" class="seal seal-logo" :src="cfg.brandLogo" mode="aspectFill" />
				<view v-else class="seal"><text>{{ cfg.brandMark }}</text></view>
				<text class="h1">门店核销工作台</text>
				<text class="h2">{{ cfg.brand }} · 促销兑奖核销系统</text>
			</view>

			<view class="card">
				<view class="card-h">
					<text class="card-h-t">门店账号登录</text>
					<text class="card-h-s">连接总部业务服务</text>
				</view>

				<input v-model="username" class="manual-in" placeholder="登录账号" maxlength="80" />
				<input v-model="password" class="manual-in" password placeholder="登录密码" maxlength="80" />
				<view class="manual-btn bl-btn bl-btn-primary" :class="{ 'bl-btn-disabled': logging }" @tap="manualLogin">
					<bl-icon name="log-out" :size="32" color="#FFF7E4" :weight="1.9" />
					<text>{{ logging ? '正在登录…' : '账号密码登录' }}</text>
				</view>

				<view class="tip">
					<bl-icon name="lock" :size="24" color="#60768C" :weight="1.8" />
					<text class="tip-t">各门店数据完全隔离，店员账号无任何数据查看与设置权限</text>
				</view>
			</view>

			<view class="back" @tap="toSales">
				<bl-icon name="users" :size="28" color="rgba(255,246,230,.82)" :weight="1.8" />
				<text class="back-t">公司销售账号登录</text>
			</view>
			<view class="back back-secondary" @tap="toC">
				<bl-icon name="smartphone" :size="28" color="rgba(255,246,230,.75)" :weight="1.8" />
				<text class="back-t">返回顾客端小程序</text>
			</view>
		</view>
	</view>
</template>

<script>
	import store from '@/store/index.js'

	export default {
		data() {
			return { username: '', password: '', logging: false }
		},
		computed: {
			cfg() { return store.state.config }
		},
		methods: {
			async manualLogin() {
				if (this.logging) return
				if (!this.username || !this.password) {
					uni.showToast({ title: '请输入账号和密码', icon: 'none' })
					return
				}
				this.logging = true
				try {
					const a = await store.loginCredentials(this.username.trim(), this.password)
					uni.showToast({ title: a.name + ' 登录成功', icon: 'none' })
					setTimeout(() => uni.redirectTo({ url: '/pagesStore/home/home' }), 420)
				} catch (error) {
					uni.showToast({ title: error.message || '登录失败', icon: 'none' })
				} finally {
					this.logging = false
				}
			},
			toC() {
				uni.reLaunch({ url: '/pages/index/index' })
			},
			toSales() {
				uni.redirectTo({ url: '/pagesSales/login/login' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		position: relative;
		background: $bl-green-ink;
	}

	.bg {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.bg-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(175deg, rgba(9, 31, 59, 0.93), rgba(6, 26, 20, 0.97));
	}

	.wrap {
		position: relative;
		z-index: 2;
		padding: 0 $bl-pad 60rpx;
	}

	.head {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx 0 44rpx;
	}

	.seal {
		width: 92rpx;
		height: 92rpx;
		border-radius: 16rpx;
		background: linear-gradient(140deg, #D6B16D, #A97834);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 10rpx 26rpx rgba(0, 0, 0, 0.35);

		text {
			color: #F5F9FD;
			font-size: 48rpx;
			font-weight: 800;
		}
	}

	.seal-logo {
		display: block;
		border: 1rpx solid rgba(255, 240, 220, 0.55);
	}

	.h1 {
		margin-top: 26rpx;
		font-size: 46rpx;
		font-weight: 800;
		color: #F5F9FD;
		letter-spacing: 4rpx;
	}

	.h2 {
		margin-top: 10rpx;
		font-size: 22rpx;
		color: rgba(240, 215, 154, 0.7);
		letter-spacing: 1rpx;
	}

	.card {
		background: $bl-card;
		border-radius: $bl-r-xl;
		padding: 30rpx 26rpx 28rpx;
		box-shadow: 0 24rpx 60rpx rgba(0, 0, 0, 0.3);
	}

	.card-h {
		display: flex;
		align-items: baseline;
		margin-bottom: 22rpx;
	}

	.card-h-t {
		font-size: 32rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.card-h-s {
		margin-left: auto;
		font-size: 21rpx;
		color: $bl-ink-4;
	}

	.manual-in {
		height: 82rpx;
		margin-top: 14rpx;
		padding: 0 20rpx;
		border: 1rpx solid $bl-line;
		border-radius: $bl-r-sm;
		background: $bl-paper-2;
		font-size: 24rpx;
	}

	.manual-btn {
		margin-top: 18rpx;
	}

	.tip {
		margin-top: 22rpx;
		display: flex;
		align-items: flex-start;
	}

	.tip-t {
		flex: 1;
		margin-left: 8rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
		line-height: 1.6;
	}

	.back {
		margin-top: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-t {
		margin-left: 10rpx;
		font-size: 24rpx;
		color: rgba(255, 246, 230, 0.75);
	}

	.back-secondary { margin-top: 20rpx; }
</style>
