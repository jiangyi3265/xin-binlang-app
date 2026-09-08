<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="兑奖记录" :show-back="false" bg="paper" />

		<!-- ============ 游客态：只邀请登录，不跳转 ============ -->
		<view v-if="!logged" class="bl-wrap">
			<bl-guest icon="ticket" title="登录后查看我的兑奖记录" reason="record"
				desc="兑奖流水、中奖奖品与到店核销状态，都会保存在你的微信账户里。"
				browse="先去看看本期奖品" @browse="toRules" />
		</view>

		<!-- ============ 概览 ============ -->
		<template v-else>
		<view class="bl-wrap">
			<view class="sum">
				<view class="sum-i">
					<text class="sum-n bl-num">{{ all.length }}</text>
					<text class="sum-l">累计兑奖</text>
				</view>
				<view class="sum-x"></view>
				<view class="sum-i">
					<text class="sum-n bl-num" style="color:#B8892B">{{ winList.length }}</text>
					<text class="sum-l">中奖</text>
				</view>
				<view class="sum-x"></view>
				<view class="sum-i">
					<text class="sum-n bl-num" style="color:#C0392B">{{ pendingCount }}</text>
					<text class="sum-l">待核销</text>
				</view>
				<view class="sum-x"></view>
				<view class="sum-i">
					<text class="sum-n bl-num">{{ winRate }}%</text>
					<text class="sum-l">中奖率</text>
				</view>
			</view>
		</view>

		<!-- ============ 双标签 ============ -->
		<view class="tabs">
			<view class="tab" :class="{ on: tab === 0 }" @tap="tab = 0">
				<text class="tab-t">已兑奖</text>
				<text class="tab-n">{{ all.length }}</text>
				<view v-if="tab === 0" class="tab-bar"></view>
			</view>
			<view class="tab" :class="{ on: tab === 1 }" @tap="tab = 1">
				<text class="tab-t">已领奖</text>
				<text class="tab-n">{{ winList.length }}</text>
				<view v-if="tab === 1" class="tab-bar"></view>
			</view>
		</view>

		<view class="bl-wrap">
			<!-- ============ Tab1 兑奖流水 ============ -->
			<view v-if="tab === 0">
			<bl-empty v-if="!all.length" icon="ticket" text="还没有兑奖记录" sub="撕开包装，输入 6 位数字兑换码试试"
					btn="立即兑奖" @action="toRedeem" />
				<view v-for="r in all" :key="r.id" class="fl bl-card" @tap="open(r)">
					<view class="fl-l" :class="r.win ? 'is-win' : 'is-lose'">
						<bl-icon :name="r.win ? 'gift' : 'leaf'" :size="40"
							:color="r.win ? '#B8892B' : '#9BB0A5'" :weight="1.7" />
					</view>
					<view class="fl-m">
						<view class="fl-r1">
							<text class="fl-code bl-num">{{ r.code }}</text>
							<text class="bl-tag" :class="r.win ? 'bl-tag-gold' : 'bl-tag-gray'">
								{{ r.win ? '已中奖' : '未中奖' }}
							</text>
						</view>
						<view class="fl-r2">
							<text class="fl-time">{{ fmt(r.redeemAt, 'YYYY-MM-DD HH:mm') }}</text>
							<text class="fl-dot">·</text>
							<text class="fl-batch">{{ r.price }} 元档 {{ poolName(r.poolId) }}</text>
						</view>
						<view class="fl-r3">
							<text class="fl-res" :class="r.win ? 'win' : ''">
								{{ r.win ? r.prizeName : '未中奖，已发放补偿券' }}
							</text>
						</view>
					</view>
					<bl-icon name="chevron-right" :size="28" color="#C3CCC6" :weight="2" />
				</view>
			</view>

			<!-- ============ Tab2 我的奖品 ============ -->
			<view v-else>
				<scroll-view class="chips" scroll-x show-scrollbar="false">
					<view class="chips-row">
						<view v-for="c in chips" :key="c.k" class="chip" :class="{ on: filter === c.k }"
							@tap="filter = c.k">
							<text>{{ c.t }}</text>
							<text v-if="c.n" class="chip-n">{{ c.n }}</text>
						</view>
					</view>
				</scroll-view>

				<bl-empty v-if="!prizeList.length" icon="gift" text="暂无对应奖品" sub="换个筛选条件看看" />

				<view v-for="r in prizeList" :key="r.id" class="pz bl-card" @tap="open(r)">
					<view class="pz-top">
						<image class="pz-img" :src="r.prizeImg" mode="aspectFill" />
						<view class="pz-txt">
							<view class="pz-r1">
								<text class="pz-n bl-ellipsis">{{ r.prizeName }}</text>
								<text class="bl-tag" :class="stTag(r.status)">{{ stText(r.status) }}</text>
							</view>
							<text class="pz-spec bl-ellipsis">{{ r.prizeLevel }} · {{ r.prizeSpec }}</text>
							<view class="pz-kv">
								<text class="pz-k">兑奖时间</text>
								<text class="pz-v">{{ fmt(r.redeemAt, 'YYYY-MM-DD HH:mm') }}</text>
							</view>
							<view v-if="r.status === 'verified'" class="pz-kv">
								<text class="pz-k">核销门店</text>
								<text class="pz-v">{{ r.storeName }}</text>
							</view>
							<view v-else-if="r.status === 'pending'" class="pz-kv">
								<text class="pz-k">领取门店</text>
								<text class="pz-v">{{ r.preferStoreName || '未选择' }}</text>
							</view>
							<view v-if="r.status === 'verified'" class="pz-kv">
								<text class="pz-k">核销时间</text>
								<text class="pz-v">{{ fmt(r.verifyAt, 'YYYY-MM-DD HH:mm') }}</text>
							</view>
						</view>
					</view>

					<view class="pz-bot">
						<view class="pz-bot-l">
							<template v-if="r.status === 'pending'">
								<bl-icon name="timer" :size="26" :color="urgent(r) ? '#C0392B' : '#8B9A92'"
									:weight="1.8" />
								<text class="pz-left" :class="{ urgent: urgent(r) }">
									剩 {{ daysLeft(r.expireAt) }} 天到期
								</text>
							</template>
							<template v-else-if="r.status === 'verified'">
								<bl-icon name="check-circle" :size="26" color="#2C7256" :weight="1.8" />
								<text class="pz-left">已完成核销</text>
							</template>
							<template v-else-if="r.status === 'frozen'">
								<bl-icon name="lock" :size="26" color="#C0392B" :weight="1.8" />
								<text class="pz-left urgent">订单已冻结</text>
							</template>
							<template v-else>
								<bl-icon name="ban" :size="26" color="#B4BFB8" :weight="1.8" />
								<text class="pz-left">已超期失效</text>
							</template>
						</view>
						<view v-if="r.status === 'pending'" class="pz-btn bl-btn bl-btn-gold bl-btn-sm"
							@tap.stop="open(r)">
							<text>出示凭证</text>
						</view>
						<view v-else class="pz-more">
							<text>详情</text>
							<bl-icon name="chevron-right" :size="22" color="#8B9A92" :weight="2" />
						</view>
					</view>
				</view>
			</view>

			<view v-if="all.length" class="tail">
				<view class="tail-line"></view>
				<text class="tail-t">仅展示本账号 90 天内记录</text>
				<view class="tail-line"></view>
			</view>
		</view>
		</template>
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { fmt, daysLeft } from '@/utils/date.js'

	export default {
		data() {
			return { tab: 0, filter: 'all' }
		},
		computed: {
			logged() { return store.isCustomerAuthenticated() },
			all() { return store.myRedeemList() },
			winList() { return store.myPrizeList('all') },
			pendingCount() { return store.myPrizeList('pending').length },
			winRate() {
				if (!this.all.length) return 0
				return Math.round((this.winList.length / this.all.length) * 1000) / 10
			},
			chips() {
				return [
					{ k: 'all', t: '全部', n: this.winList.length },
					{ k: 'pending', t: '待核销', n: store.myPrizeList('pending').length },
					{ k: 'verified', t: '已核销', n: store.myPrizeList('verified').length },
					{ k: 'expired', t: '已过期', n: store.myPrizeList('expired').length },
					{ k: 'frozen', t: '已冻结', n: store.myPrizeList('frozen').length }
				]
			},
			prizeList() { return store.myPrizeList(this.filter) }
		},
		onShow() {
			store.tickExpire()
			store.syncCustomer().catch(() => {})
		},
		onLoad(opt) {
			if (opt && opt.tab) this.tab = Number(opt.tab)
		},
		methods: {
			fmt,
			daysLeft,
			poolName(id) {
				const p = store.poolById(id)
				return p ? p.name : ''
			},
			urgent(r) {
				return daysLeft(r.expireAt) <= 3
			},
			stText(s) {
				return { pending: '待核销', verified: '已核销', expired: '已过期', frozen: '已冻结' }[s] || ''
			},
			stTag(s) {
				return {
					pending: 'bl-tag-red', verified: 'bl-tag-green',
					expired: 'bl-tag-gray', frozen: 'bl-tag-blue'
				}[s] || 'bl-tag-gray'
			},
			toRedeem() {
				uni.navigateTo({ url: '/pages/redeem/redeem' })
			},
			toRules() {
				uni.switchTab({ url: '/pages/rules/rules' })
			},
			open(r) {
				if (!r.win) {
					uni.showToast({ title: '本次未中奖，已发放补偿券', icon: 'none' })
					return
				}
				uni.navigateTo({ url: '/pages/record/detail?id=' + r.id })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		padding-bottom: 60rpx;
	}

	/* ============ 概览 ============ */
	.sum {
		margin-top: 12rpx;
		background: linear-gradient(120deg, #14332A 0%, #0B241C 100%);
		border-radius: $bl-r-lg;
		padding: 30rpx 0;
		display: flex;
		align-items: center;
		box-shadow: $bl-sd-green;
	}

	.sum-i {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.sum-n {
		font-size: 42rpx;
		color: #FFF6E6;
	}

	.sum-l {
		margin-top: 4rpx;
		font-size: 20rpx;
		color: rgba(255, 246, 230, 0.55);
	}

	.sum-x {
		width: 1rpx;
		height: 44rpx;
		background: rgba(255, 246, 230, 0.14);
	}

	/* ============ 标签 ============ */
	.tabs {
		margin-top: 28rpx;
		display: flex;
		padding: 0 $bl-pad;
		border-bottom: 1rpx solid $bl-line;
	}

	.tab {
		position: relative;
		display: flex;
		align-items: baseline;
		padding: 0 8rpx 20rpx;
		margin-right: 56rpx;
	}

	.tab-t {
		font-size: 30rpx;
		color: $bl-ink-3;
		font-weight: 600;
	}

	.tab.on .tab-t {
		font-size: 34rpx;
		color: $bl-ink;
		font-weight: 800;
	}

	.tab-n {
		margin-left: 8rpx;
		font-size: 22rpx;
		color: $bl-ink-4;
	}

	.tab-bar {
		position: absolute;
		left: 50%;
		bottom: -1rpx;
		width: 48rpx;
		height: 6rpx;
		margin-left: -24rpx;
		border-radius: 3rpx;
		background: linear-gradient(90deg, $bl-gold-2, $bl-gold);
	}

	/* ============ 流水 ============ */
	.fl {
		margin-top: 20rpx;
		padding: 24rpx;
		display: flex;
		align-items: center;
	}

	.fl-l {
		width: 84rpx;
		height: 84rpx;
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&.is-win {
			background: $bl-gold-lt;
			border: 1rpx solid rgba(184, 137, 43, 0.25);
		}

		&.is-lose {
			background: #F2F4F2;
			border: 1rpx solid $bl-line;
		}
	}

	.fl-m {
		flex: 1;
		margin-left: 22rpx;
		min-width: 0;
	}

	.fl-r1 {
		display: flex;
		align-items: center;
	}

	.fl-code {
		font-size: 34rpx;
		color: $bl-ink;
		letter-spacing: 3rpx;
		margin-right: 14rpx;
	}

	.fl-r2 {
		margin-top: 6rpx;
		display: flex;
		align-items: center;
	}

	.fl-time,
	.fl-batch {
		font-size: 21rpx;
		color: $bl-ink-4;
	}

	.fl-dot {
		margin: 0 8rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	.fl-r3 {
		margin-top: 8rpx;
	}

	.fl-res {
		font-size: 24rpx;
		color: $bl-ink-3;

		&.win {
			color: $bl-green;
			font-weight: 700;
		}
	}

	/* ============ 筛选 ============ */
	.chips {
		width: 100%;
		white-space: nowrap;
		margin-top: 24rpx;
	}

	.chips-row {
		display: flex;
	}

	.chip {
		flex-shrink: 0;
		height: 60rpx;
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
				color: #FFF6E6;
				font-weight: 700;
			}
		}
	}

	.chip-n {
		margin-left: 8rpx;
		font-size: 21rpx !important;
		opacity: 0.7;
	}

	/* ============ 奖品卡 ============ */
	.pz {
		margin-top: 22rpx;
		padding: 24rpx;
	}

	.pz-top {
		display: flex;
	}

	.pz-img {
		width: 172rpx;
		height: 172rpx;
		border-radius: $bl-r-md;
		flex-shrink: 0;
		background: #F2F1EC;
	}

	.pz-txt {
		flex: 1;
		margin-left: 22rpx;
		min-width: 0;
	}

	.pz-r1 {
		display: flex;
		align-items: center;
	}

	.pz-n {
		flex: 1;
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
		margin-right: 12rpx;
	}

	.pz-spec {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: $bl-ink-4;
	}

	.pz-kv {
		margin-top: 8rpx;
		display: flex;
		align-items: center;
	}

	.pz-k {
		width: 116rpx;
		font-size: 21rpx;
		color: $bl-ink-4;
	}

	.pz-v {
		flex: 1;
		font-size: 22rpx;
		color: $bl-ink-2;
	}

	.pz-bot {
		margin-top: 22rpx;
		padding-top: 20rpx;
		border-top: 1rpx dashed $bl-line;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.pz-bot-l {
		display: flex;
		align-items: center;
	}

	.pz-left {
		margin-left: 8rpx;
		font-size: 23rpx;
		color: $bl-ink-3;

		&.urgent {
			color: $bl-red;
			font-weight: 700;
		}
	}

	.pz-more {
		display: flex;
		align-items: center;
		font-size: 23rpx;
		color: $bl-ink-3;
	}

	/* ============ 尾巴 ============ */
	.tail {
		margin-top: 46rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tail-line {
		width: 80rpx;
		height: 1rpx;
		background: $bl-line;
	}

	.tail-t {
		margin: 0 18rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
	}
</style>
