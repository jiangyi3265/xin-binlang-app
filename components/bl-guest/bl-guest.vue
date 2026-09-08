<template>
	<view class="gs bl-card">
		<view class="gs-ico">
			<bl-icon :name="icon" :size="66" color="#B8892B" :weight="1.6" />
		</view>
		<text class="gs-t">{{ title }}</text>
		<text class="gs-d">{{ desc }}</text>
		<view class="gs-btn bl-btn bl-btn-primary" @tap="login">
			<bl-icon name="message-circle" :size="32" color="#FFF8E8" :weight="2" />
			<text class="gs-btn-t">微信登录</text>
		</view>
		<view v-if="browse" class="gs-alt" @tap="$emit('browse')">
			<text>{{ browse }}</text>
			<bl-icon name="chevron-right" :size="22" color="#8B9A92" :weight="2" />
		</view>
		<text class="gs-note">不登录也可以浏览活动详情、奖品与可核销门店</text>
	</view>
</template>

<script>
	import { requireCustomerLogin } from '@/utils/api.js'

	/**
	 * 游客态占位卡：个人数据页面在未登录时展示。
	 * 这里只邀请登录，绝不代替用户跳登录页 —— 由用户自己点。
	 */
	export default {
		name: 'bl-guest',
		props: {
			icon: { type: String, default: 'user' },
			title: { type: String, default: '登录后查看' },
			desc: { type: String, default: '登录只用于保存你的兑奖记录与领奖凭证。' },
			reason: { type: String, default: '' },
			browse: { type: String, default: '' }
		},
		emits: ['browse'],
		methods: {
			login() {
				requireCustomerLogin({ reason: this.reason })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.gs {
		margin: 40rpx 0 24rpx;
		padding: 56rpx 40rpx 44rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.gs-ico {
		width: 128rpx;
		height: 128rpx;
		border-radius: 50%;
		background: $bl-gold-lt;
		border: 1rpx solid rgba(184, 137, 43, 0.24);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.gs-t {
		margin-top: 28rpx;
		font-size: $bl-fs-h3;
		font-weight: 800;
		color: $bl-ink;
		letter-spacing: 1rpx;
	}

	.gs-d {
		margin-top: 14rpx;
		max-width: 500rpx;
		font-size: $bl-fs-xs;
		color: $bl-ink-3;
		line-height: 1.7;
		text-align: center;
	}

	.gs-btn {
		width: 100%;
		margin-top: 36rpx;
		gap: 12rpx;
	}

	.gs-btn-t {
		font-size: 30rpx;
		font-weight: 700;
		letter-spacing: 2rpx;
	}

	.gs-alt {
		margin-top: 26rpx;
		display: flex;
		align-items: center;
		gap: 4rpx;
		font-size: $bl-fs-sm;
		color: $bl-green;
		font-weight: 600;
	}

	.gs-note {
		margin-top: 22rpx;
		font-size: $bl-fs-tiny;
		color: $bl-ink-4;
		text-align: center;
	}
</style>
