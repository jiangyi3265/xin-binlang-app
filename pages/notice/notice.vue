<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="服务通知" bg="paper">
			<template #right>
				<view v-if="logged" class="nav-r" @tap="readAll">
					<text>全部已读</text>
				</view>
			</template>
		</bl-navbar>

		<view v-if="!logged" class="bl-wrap">
			<bl-guest icon="bell" title="登录后接收服务通知" reason="notice"
				desc="中奖、到店核销与奖品到期提醒，登录后会发到你的账户。" />
		</view>

		<view v-else class="bl-wrap">
			<view class="banner">
				<view class="banner-ico">
					<bl-icon name="bell" :size="38" color="#B8892B" :weight="1.8" />
				</view>
				<view class="banner-txt">
					<text class="banner-t">微信服务通知已开启</text>
					<text class="banner-d">兑奖成功、中奖提醒、临期与核销结果将通过微信服务通知推送</text>
				</view>
			</view>

			<bl-empty v-if="!list.length" icon="bell" text="暂无通知" />

			<view v-for="n in list" :key="n.id" class="nt bl-card" :class="{ unread: !n.read }" @tap="open(n)">
				<view class="nt-ico" :style="'background:' + bg(n.type)">
					<bl-icon :name="icon(n.type)" :size="36" :color="color(n.type)" :weight="1.8" />
				</view>
				<view class="nt-body">
					<view class="nt-h">
						<text class="nt-t">{{ n.title }}</text>
						<text class="nt-time">{{ rel(n.at) }}</text>
					</view>
					<text class="nt-d">{{ n.desc }}</text>
					<view v-if="n.link" class="nt-more">
						<text class="nt-more-t">查看详情</text>
						<bl-icon name="chevron-right" :size="22" color="#0E3B2E" :weight="2" />
					</view>
				</view>
				<view v-if="!n.read" class="nt-dot"></view>
			</view>
		</view>
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { rel } from '@/utils/date.js'

	const MAP = {
		win: { icon: 'trophy', color: '#B8892B', bg: '#FAF1DC' },
		coupon: { icon: 'ticket-percent', color: '#2F6D8C', bg: '#EAF2F6' },
		verify: { icon: 'badge-check', color: '#2C7256', bg: '#E7EFEA' },
		expire: { icon: 'hourglass', color: '#C0392B', bg: '#FCEDEA' },
		expired: { icon: 'ban', color: '#8B9A92', bg: '#F2F1EC' }
	}

	export default {
		computed: {
			logged() { return store.isCustomerAuthenticated() },
			list() {
				return store.state.notices.slice().sort((a, b) => b.at - a.at)
			}
		},
		methods: {
			rel,
			icon(t) { return (MAP[t] || MAP.expired).icon },
			color(t) { return (MAP[t] || MAP.expired).color },
			bg(t) { return (MAP[t] || MAP.expired).bg },
			readAll() {
				store.readAllNotice()
				uni.showToast({ title: '已全部标记为已读', icon: 'none' })
			},
			open(n) {
				store.readNotice(n.id)
				if (!n.link) return
				const r = store.recordByCode(n.link)
				if (r && r.win) uni.navigateTo({ url: '/pages/record/detail?id=' + r.id })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		padding-bottom: 60rpx;
	}

	.nav-r {
		padding: 10rpx 16rpx;

		text {
			font-size: 24rpx;
			color: $bl-ink-2;
		}
	}

	.banner {
		margin-top: 12rpx;
		display: flex;
		align-items: center;
		padding: 24rpx;
		background: $bl-gold-lt;
		border: 1rpx solid rgba(184, 137, 43, 0.22);
		border-radius: $bl-r-lg;
	}

	.banner-ico {
		width: 76rpx;
		height: 76rpx;
		border-radius: $bl-r-md;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.banner-txt {
		flex: 1;
		margin-left: 20rpx;
	}

	.banner-t {
		display: block;
		font-size: 27rpx;
		font-weight: 700;
		color: #6B4E12;
	}

	.banner-d {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: #A07A2A;
		line-height: 1.5;
	}

	.nt {
		margin-top: 20rpx;
		padding: 26rpx 24rpx;
		display: flex;
		position: relative;

		&.unread {
			border-color: rgba(184, 137, 43, 0.35);
		}
	}

	.nt-ico {
		width: 76rpx;
		height: 76rpx;
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.nt-body {
		flex: 1;
		margin-left: 22rpx;
		min-width: 0;
	}

	.nt-h {
		display: flex;
		align-items: baseline;
	}

	.nt-t {
		flex: 1;
		font-size: 29rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.nt-time {
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	.nt-d {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: $bl-ink-2;
		line-height: 1.65;
	}

	.nt-more {
		margin-top: 14rpx;
		display: flex;
		align-items: center;
	}

	.nt-more-t {
		font-size: 23rpx;
		color: $bl-green;
		font-weight: 600;
	}

	.nt-dot {
		position: absolute;
		right: 22rpx;
		top: 24rpx;
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: $bl-red;
	}
</style>
