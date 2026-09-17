<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="我的优惠券" bg="paper" />

		<view v-if="!logged" class="bl-wrap">
			<bl-guest icon="ticket-percent" title="登录后查看我的优惠券" reason="coupon"
				desc="已发放优惠券的面额与有效期，登录后即可查看。"
				browse="先去看看可用门店" @browse="use" />
		</view>

		<view v-else class="bl-wrap">
			<view class="head">
				<view class="head-l">
					<text class="head-n bl-num">{{ usable.length }}</text>
					<text class="head-t">张可用</text>
				</view>
				<view class="head-r">
					<bl-icon name="ticket-percent" :size="64" color="rgba(240,215,154,.35)" :weight="1.4" />
				</view>
				<text class="head-d">未中奖自动发放，可在合作门店购买产品时抵扣</text>
			</view>

			<view class="tabs">
				<view v-for="t in tabs" :key="t.k" class="tab" :class="{ on: tab === t.k }" @tap="tab = t.k">
					<text>{{ t.t }}</text>
					<text class="tab-n">{{ t.n }}</text>
				</view>
			</view>

			<bl-empty v-if="!list.length" icon="ticket-percent" text="暂无优惠券"
				:sub="tab === 'usable' ? '已领取的活动优惠券会显示在这里' : '这里空空如也'" />

			<view v-for="c in list" :key="c.id" class="cp" :class="{ dead: tab !== 'usable' }">
				<view class="cp-l">
					<view class="cp-amt">
						<text class="cp-cur">¥</text>
						<text class="cp-num bl-num">{{ c.amount }}</text>
					</view>
					<text class="cp-floor">满 {{ c.floor }} 元可用</text>
				</view>
				<view class="cp-cut">
					<view class="cp-cut-t"></view>
					<view class="cp-cut-line"></view>
					<view class="cp-cut-b"></view>
				</view>
				<view class="cp-r">
					<view class="cp-r-top">
						<text class="cp-n">{{ c.name }}</text>
						<text class="bl-tag" :class="tagCls">{{ tagText }}</text>
					</view>
					<text class="cp-s">{{ c.sub }} · 来源：{{ c.from }}</text>
					<view class="cp-foot">
						<view class="cp-time">
							<bl-icon name="clock" :size="22" :color="tab === 'usable' ? '#94692B' : '#9AAEBF'"
								:weight="1.8" />
							<text class="cp-time-t">{{ fmt(c.at, 'MM-DD') }} 至 {{ fmt(c.expireAt, 'YYYY-MM-DD') }}</text>
						</view>
						<view v-if="tab === 'usable'" class="cp-btn" @tap="use(c)">
							<text>去使用</text>
						</view>
					</view>
				</view>
			</view>

			<view v-if="list.length" class="tip">
				<bl-icon name="info" :size="24" color="#60768C" :weight="1.8" />
				<text class="tip-t">优惠券不可叠加使用，不可兑换现金，最终解释权归主办方所有</text>
			</view>
		</view>
	</view>
</template>

<script>
	// #ifdef MP-WEIXIN
	import { activityShare } from '@/utils/share.mjs'
	// #endif
	import store from '@/store/index.js'
	import { fmt } from '@/utils/date.js'

	export default {
		// #ifdef MP-WEIXIN
		onShareAppMessage() { return activityShare() },
		// #endif
		data() {
			return { tab: 'usable' }
		},
		computed: {
			logged() { return store.isCustomerAuthenticated() },
			all() { return store.state.coupons },
			usable() {
				const now = Date.now()
				return this.all.filter(c => !c.used && c.expireAt > now)
			},
			used() { return this.all.filter(c => c.used) },
			expired() {
				const now = Date.now()
				return this.all.filter(c => !c.used && c.expireAt <= now)
			},
			tabs() {
				return [
					{ k: 'usable', t: '可使用', n: this.usable.length },
					{ k: 'used', t: '已使用', n: this.used.length },
					{ k: 'expired', t: '已过期', n: this.expired.length }
				]
			},
			list() {
				return { usable: this.usable, used: this.used, expired: this.expired }[this.tab]
			},
			tagText() {
				return { usable: '可使用', used: '已使用', expired: '已过期' }[this.tab]
			},
			tagCls() {
				return { usable: 'bl-tag-gold', used: 'bl-tag-gray', expired: 'bl-tag-gray' }[this.tab]
			}
		},
		methods: {
			fmt,
			use() {
				uni.navigateTo({ url: '/pages/store/list' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		padding-bottom: 60rpx;
	}

	.head {
		position: relative;
		margin-top: 12rpx;
		padding: 34rpx 30rpx;
		border-radius: $bl-r-lg;
		background: linear-gradient(120deg, #14385E 0%, #0B2445 100%);
		box-shadow: $bl-sd-green;
		overflow: hidden;
	}

	.head-l {
		display: flex;
		align-items: baseline;
	}

	.head-n {
		font-size: 68rpx;
		color: #E5C58A;
	}

	.head-t {
		margin-left: 12rpx;
		font-size: 26rpx;
		color: rgba(255, 246, 230, 0.8);
	}

	.head-r {
		position: absolute;
		right: 26rpx;
		top: 30rpx;
	}

	.head-d {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: rgba(255, 246, 230, 0.5);
	}

	.tabs {
		margin: 28rpx 0 8rpx;
		display: flex;
	}

	.tab {
		height: 62rpx;
		padding: 0 26rpx;
		border-radius: $bl-r-pill;
		background: #fff;
		border: 1rpx solid $bl-line;
		display: flex;
		align-items: center;
		margin-right: 16rpx;

		text {
			font-size: 25rpx;
			color: $bl-ink-2;
		}

		&.on {
			background: $bl-green;
			border-color: $bl-green;

			text {
				color: #F5F9FD;
				font-weight: 700;
			}
		}
	}

	.tab-n {
		margin-left: 8rpx;
		font-size: 21rpx !important;
		opacity: 0.72;
	}

	/* ============ 券 ============ */
	.cp {
		margin-top: 22rpx;
		display: flex;
		background: $bl-card;
		border-radius: $bl-r-lg;
		box-shadow: $bl-sd-sm;
		border: 1rpx solid rgba(184, 137, 43, 0.22);
		overflow: hidden;

		&.dead {
			border-color: $bl-line;
			opacity: 0.72;
		}
	}

	.cp-l {
		width: 210rpx;
		background: linear-gradient(160deg, #FFF7E6, #FAEDD4);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 30rpx 0;
	}

	.cp.dead .cp-l {
		background: #F3F3F0;
	}

	.cp-amt {
		display: flex;
		align-items: baseline;
	}

	.cp-cur {
		font-size: 28rpx;
		color: $bl-red;
		font-weight: 700;
	}

	.cp.dead .cp-cur,
	.cp.dead .cp-num {
		color: $bl-ink-4;
	}

	.cp-num {
		font-size: 72rpx;
		color: $bl-red;
		line-height: 1;
	}

	.cp-floor {
		margin-top: 8rpx;
		font-size: 20rpx;
		color: #A07A2A;
	}

	.cp.dead .cp-floor {
		color: $bl-ink-4;
	}

	.cp-cut {
		width: 2rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.cp-cut-t,
	.cp-cut-b {
		width: 24rpx;
		height: 12rpx;
		background: $bl-paper;
		border-radius: 0 0 12rpx 12rpx;
	}

	.cp-cut-b {
		border-radius: 12rpx 12rpx 0 0;
	}

	.cp-cut-line {
		flex: 1;
		width: 2rpx;
		background-image: linear-gradient(180deg, rgba(184, 137, 43, 0.35) 0 10rpx, transparent 10rpx 20rpx);
		background-size: 2rpx 20rpx;
	}

	.cp-r {
		flex: 1;
		padding: 24rpx 24rpx 24rpx 28rpx;
		position: relative;
	}

	.cp-r-top {
		display: flex;
		align-items: center;
	}

	.cp-n {
		flex: 1;
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.cp-s {
		display: block;
		margin-top: 8rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
	}

	.cp-foot {
		margin-top: 16rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.cp-time {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
	}

	.cp-time-t {
		margin-left: 6rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	.cp-btn {
		flex-shrink: 0;
		margin-left: 16rpx;
		height: 54rpx;
		padding: 0 24rpx;
		border-radius: $bl-r-pill;
		background: linear-gradient(135deg, #F3D689, $bl-gold);
		display: flex;
		align-items: center;

		text {
			font-size: 23rpx;
			font-weight: 700;
			color: #3B2A06;
		}
	}

	.tip {
		margin-top: 32rpx;
		display: flex;
		align-items: flex-start;
		padding: 0 8rpx;
	}

	.tip-t {
		flex: 1;
		margin-left: 8rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
		line-height: 1.6;
	}
</style>
