<template>
	<view class="sb-root">
		<view class="sb">
			<view v-for="(it, i) in list" :key="i" class="sb-i" @tap="go(it)">
				<view class="sb-ico">
					<bl-icon :name="it.icon" :size="42" :color="active === it.key ? '#102E53' : '#9AA8A0'"
						:weight="active === it.key ? 2 : 1.7" />
					<view v-if="it.dot" class="sb-dot"><text>{{ it.dot > 99 ? '99+' : it.dot }}</text></view>
				</view>
				<text class="sb-t" :class="{ on: active === it.key }">{{ it.text }}</text>
			</view>
		</view>
		<view class="sb-hold"></view>
	</view>
</template>

<script>
	import store from '@/store/index.js'

	export default {
		name: 'bl-storebar',
		props: {
			active: { type: String, default: 'home' }
		},
		computed: {
			canView() {
				return store.canViewData()
			},
			pending() {
				return store.storePendingCount()
			},
			list() {
				return [
					{ key: 'home', text: '工作台', icon: 'layout-grid', url: '/pagesStore/home/home' },
					{ key: 'scan', text: '核销', icon: 'scan-qr', url: '/pagesStore/scan/scan' },
					{
						key: 'orders', text: '订单', icon: 'clipboard-list',
						url: '/pagesStore/orders/orders', dot: this.canView ? this.pending : 0
					},
					{ key: 'me', text: '我的', icon: 'user', url: '/pagesStore/me/me' }
				]
			}
		},
		methods: {
			go(it) {
				if (it.key === this.active) return
				uni.redirectTo({ url: it.url })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.sb-root {
		height: calc(108rpx + constant(safe-area-inset-bottom));
		height: calc(108rpx + env(safe-area-inset-bottom));
	}

	.sb {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 80;
		display: flex;
		background: rgba(255, 255, 255, 0.97);
		border-top: 1rpx solid $bl-line-2;
		box-shadow: 0 -6rpx 24rpx rgba(22, 38, 31, 0.05);
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
	}

	.sb-i {
		flex: 1;
		height: 108rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.sb-ico {
		position: relative;
	}

	.sb-dot {
		position: absolute;
		right: -16rpx;
		top: -8rpx;
		min-width: 30rpx;
		height: 30rpx;
		padding: 0 7rpx;
		border-radius: 15rpx;
		background: $bl-red;
		color: #fff;
		font-size: 18rpx;
		line-height: 30rpx;
		text-align: center;
		border: 2rpx solid #fff;
	}

	.sb-t {
		margin-top: 4rpx;
		font-size: 20rpx;
		color: #9AA8A0;

		&.on {
			color: $bl-green;
			font-weight: 700;
		}
	}
</style>
