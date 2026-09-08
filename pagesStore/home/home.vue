<template>
	<view class="pg bl-paper-tex">
		<!-- ============ 顶部 ============ -->
		<view class="top">
			<image class="top-bg" :src="topBg" mode="aspectFill" />
			<view class="top-mask"></view>
			<bl-navbar bg="transparent" :show-back="false" :fixed="false">
				<template #title>
					<text class="nav-t">门店工作台</text>
				</template>
				<template #right>
					<view class="nav-r" @tap="go('/pagesStore/me/me')">
						<bl-icon name="user" :size="36" color="#FFF6E6" :weight="1.8" />
					</view>
				</template>
			</bl-navbar>

			<view class="top-in">
				<view class="who">
					<image class="who-ava" :src="acc.avatar" mode="aspectFill" />
					<view class="who-txt">
						<view class="who-r1">
							<text class="who-n">{{ acc.name }}</text>
							<text class="bl-tag" :class="roleCls">{{ roleText }}</text>
						</view>
						<text class="who-s">{{ storeInfo ? storeInfo.name : '总部超级核销账号' }}</text>
					</view>
				</view>
				<view class="today">
					<view class="today-i">
						<text class="today-n bl-num">{{ st.todayVerify }}</text>
						<text class="today-l">今日核销</text>
					</view>
					<view class="today-x"></view>
					<view class="today-i">
						<text class="today-n bl-num">{{ st.pending }}</text>
						<text class="today-l">待核销</text>
					</view>
					<view class="today-x"></view>
					<view class="today-i">
						<text class="today-n bl-num">{{ st.todayRedeem }}</text>
						<text class="today-l">今日兑奖</text>
					</view>
				</view>
			</view>
		</view>

		<view class="bl-wrap">
			<!-- ============ 核销主入口 ============ -->
			<view class="act">
				<view class="act-main" @tap="go('/pagesStore/scan/scan')">
					<view class="act-main-ico">
						<bl-icon name="scan-qr" :size="72" color="#FFF7E4" :weight="1.6" />
					</view>
					<text class="act-main-t">扫码核销</text>
					<text class="act-main-d">扫描顾客领奖凭证二维码</text>
				</view>
				<view class="act-side">
					<view class="act-s" @tap="go('/pagesStore/input/input')">
						<bl-icon name="keyboard" :size="42" color="#B8892B" :weight="1.7" />
						<text class="act-s-t">输码核销</text>
					</view>
					<view class="act-s" @tap="go('/pagesStore/orders/orders')">
						<bl-icon name="clipboard-list" :size="42" color="#2C7256" :weight="1.7" />
						<text class="act-s-t">核销订单</text>
						<view v-if="st.pending" class="act-s-dot"><text>{{ st.pending }}</text></view>
					</view>
				</view>
			</view>

			<!-- ============ 功能宫格 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">常用功能</text>
				</view>
				<view v-if="!canView" class="bl-sec-more">
					<bl-icon name="lock" :size="22" color="#8B9A92" :weight="1.9" />
					<text style="margin-left:6rpx">店员权限受限</text>
				</view>
			</view>
			<view class="grid bl-card">
				<view v-for="g in grids" :key="g.k" class="grid-i" @tap="onGrid(g)">
					<view class="grid-ico" :style="'background:' + g.bg">
						<bl-icon :name="g.icon" :size="40" :color="g.locked ? '#B4BFB8' : g.color" :weight="1.75" />
					</view>
					<text class="grid-t" :class="{ off: g.locked }">{{ g.t }}</text>
					<view v-if="g.locked" class="grid-lock">
						<bl-icon name="lock" :size="18" color="#B4BFB8" :weight="2" />
					</view>
				</view>
			</view>

			<!-- ============ 待核销 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">待核销订单</text>
					<text class="bl-sec-sub">{{ pendingList.length }} 单</text>
				</view>
				<view class="bl-sec-more" @tap="go('/pagesStore/orders/orders')">
					<text>全部</text>
					<bl-icon name="chevron-right" :size="24" color="#8B9A92" :weight="2" />
				</view>
			</view>

			<bl-empty v-if="!pendingList.length" icon="clipboard-list" text="暂无待核销订单"
				sub="顾客选择本店领奖后会出现在这里" />

			<view v-for="r in pendingList.slice(0, 4)" :key="r.id" class="od bl-card" @tap="toDetail(r)">
				<image class="od-img" :src="r.prizeImg" mode="aspectFill" />
				<view class="od-txt">
					<view class="od-r1">
						<text class="od-n bl-ellipsis">{{ r.prizeName }}</text>
						<text class="od-code bl-num">{{ r.code }}</text>
					</view>
					<view class="od-r2">
						<image class="od-ava" :src="r.userAvatar" mode="aspectFill" />
						<text class="od-user">{{ r.userNick }} · {{ r.userPhone }}</text>
					</view>
					<view class="od-r3">
						<text class="od-time">{{ rel(r.redeemAt) }} 兑奖</text>
						<text class="od-left" :class="{ urgent: daysLeft(r.expireAt) <= 3 }">
							剩 {{ daysLeft(r.expireAt) }} 天
						</text>
					</view>
				</view>
				<view class="od-btn" @tap.stop="toConfirm(r)">
					<text>核销</text>
				</view>
			</view>
		</view>

		<bl-storebar active="home" />
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { publicAsset } from '@/utils/api.js'
	import { rel, daysLeft } from '@/utils/date.js'

	export default {
		data() {
			return { tickKey: 0 }
		},
		computed: {
			topBg() { return (this.storeInfo && this.storeInfo.img) || publicAsset('/assets/store-1.jpg') },
			acc() { return store.account() || {} },
			storeInfo() { return store.myStore() },
			canView() { return store.canViewData() },
			st() { return store.storeStats() },
			pendingList() { return store.storeOrders('pending') },
			roleText() {
				return { owner: '店主', staff: '店员', hq: '总部' }[this.acc.role] || ''
			},
			roleCls() {
				return { owner: 'bl-tag-gold', staff: 'bl-tag-green', hq: 'bl-tag-red' }[this.acc.role] || 'bl-tag-gray'
			},
			grids() {
				const lock = !this.canView
				return [
					{ k: 'orders', t: '核销订单', icon: 'clipboard-list', color: '#2C7256', bg: '#E7EFEA', url: '/pagesStore/orders/orders', locked: lock },
					{ k: 'stats', t: '门店数据', icon: 'bar-chart', color: '#2F6D8C', bg: '#EAF2F6', url: '/pagesStore/stats/stats', locked: lock },
					{ k: 'logs', t: '核销日志', icon: 'history', color: '#B8892B', bg: '#FAF1DC', url: '/pagesStore/logs/logs', locked: lock },
					{ k: 'prize', t: '奖品库', icon: 'gift', color: '#C0392B', bg: '#FCEDEA', url: '/pagesStore/prize/prize', locked: false },
					{ k: 'staff', t: '员工管理', icon: 'users', color: '#4A5C52', bg: '#F0EFEA', url: '/pagesStore/staff/staff', locked: this.acc.role === 'staff' },
					{ k: 'export', t: '导出报表', icon: 'file-spreadsheet', color: '#2C7256', bg: '#E7EFEA', url: '', locked: lock },
					{ k: 'rule', t: '活动规则', icon: 'scroll-text', color: '#B8892B', bg: '#FAF1DC', url: '/pages/rules/rules', tab: true, locked: false },
					{ k: 'me', t: '门店中心', icon: 'store', color: '#2F6D8C', bg: '#EAF2F6', url: '/pagesStore/me/me', locked: false }
				]
			}
		},
		onShow() {
			store.tickExpire()
			this.tickKey++
			if (!store.account()) uni.redirectTo({ url: '/pagesStore/login/login' })
		},
		methods: {
			rel,
			daysLeft,
			go(url) { uni.navigateTo({ url }) },
			async onGrid(g) {
				if (g.locked) {
					uni.showToast({ title: '店员账号无该权限', icon: 'none' })
					return
				}
				if (g.k === 'export') {
					try {
						await store.exportStoreOrders()
						uni.showToast({ title: '报表已生成', icon: 'success' })
					} catch (error) {
						uni.showToast({ title: error.message || '导出失败', icon: 'none' })
					}
					return
				}
				if (!g.url) return
				/* tabBar 页面属于顾客端主包，只能用 reLaunch 过去 */
				if (g.tab) {
					uni.reLaunch({ url: g.url })
					return
				}
				uni.navigateTo({ url: g.url })
			},
			toDetail(r) {
				uni.navigateTo({ url: '/pagesStore/orders/detail?id=' + r.id })
			},
			toConfirm(r) {
				uni.navigateTo({ url: '/pagesStore/confirm/confirm?code=' + r.code })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
	}

	.nav-t {
		color: #FFF6E6;
		font-size: 34rpx;
		font-weight: 700;
	}

	.nav-r {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.14);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ============ 顶部 ============ */
	.top {
		position: relative;
		padding-bottom: 100rpx;
		overflow: hidden;
	}

	.top-bg {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.top-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(175deg, rgba(10, 43, 33, 0.92), rgba(14, 59, 46, 0.95));
	}

	.top-in {
		position: relative;
		z-index: 2;
		padding: 14rpx $bl-pad 0;
	}

	.who {
		display: flex;
		align-items: center;
	}

	.who-ava {
		width: 92rpx;
		height: 92rpx;
		border-radius: $bl-r-md;
		border: 2rpx solid rgba(240, 215, 154, 0.4);
	}

	.who-txt {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
	}

	.who-r1 {
		display: flex;
		align-items: center;
	}

	.who-n {
		font-size: 34rpx;
		font-weight: 800;
		color: #FFF6E6;
		margin-right: 12rpx;
	}

	.who-s {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: rgba(240, 215, 154, 0.75);
	}

	.today {
		margin-top: 30rpx;
		display: flex;
		align-items: center;
	}

	.today-i {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.today-n {
		font-size: 52rpx;
		color: #F0D79A;
	}

	.today-l {
		margin-top: 2rpx;
		font-size: 21rpx;
		color: rgba(255, 246, 230, 0.55);
	}

	.today-x {
		width: 1rpx;
		height: 44rpx;
		background: rgba(255, 246, 230, 0.16);
	}

	/* ============ 核销入口 ============ */
	.act {
		margin-top: -70rpx;
		position: relative;
		z-index: 5;
		display: flex;
	}

	.act-main {
		width: 380rpx;
		border-radius: $bl-r-xl;
		background: linear-gradient(140deg, #17553F 0%, #0B2A20 100%);
		padding: 34rpx 28rpx;
		box-shadow: 0 18rpx 44rpx rgba(11, 42, 32, 0.35);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.act-main-ico {
		width: 108rpx;
		height: 108rpx;
		border-radius: $bl-r-lg;
		background: rgba(240, 215, 154, 0.14);
		border: 1rpx solid rgba(240, 215, 154, 0.22);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.act-main-t {
		margin-top: 22rpx;
		font-size: 38rpx;
		font-weight: 800;
		color: #FFF6E6;
		letter-spacing: 2rpx;
	}

	.act-main-d {
		margin-top: 6rpx;
		font-size: 21rpx;
		color: rgba(240, 215, 154, 0.6);
	}

	.act-side {
		flex: 1;
		margin-left: 20rpx;
		display: flex;
		flex-direction: column;
	}

	.act-s {
		flex: 1;
		background: $bl-card;
		border-radius: $bl-r-lg;
		border: 1rpx solid rgba(230, 225, 212, 0.9);
		box-shadow: $bl-sd-sm;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;

		&:first-child {
			margin-bottom: 20rpx;
		}
	}

	.act-s-t {
		margin-top: 10rpx;
		font-size: 25rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.act-s-dot {
		position: absolute;
		right: 22rpx;
		top: 18rpx;
		min-width: 34rpx;
		height: 34rpx;
		padding: 0 8rpx;
		border-radius: 17rpx;
		background: $bl-red;
		display: flex;
		align-items: center;
		justify-content: center;

		text {
			color: #fff;
			font-size: 20rpx;
			font-weight: 700;
		}
	}

	/* ============ 宫格 ============ */
	.grid {
		display: flex;
		flex-wrap: wrap;
		padding: 26rpx 0 6rpx;
	}

	.grid-i {
		width: 25%;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 26rpx;
		position: relative;
	}

	.grid-ico {
		width: 84rpx;
		height: 84rpx;
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.grid-t {
		margin-top: 12rpx;
		font-size: 22rpx;
		color: $bl-ink-2;

		&.off {
			color: $bl-ink-4;
		}
	}

	.grid-lock {
		position: absolute;
		right: 32rpx;
		top: -4rpx;
		width: 30rpx;
		height: 30rpx;
		border-radius: 50%;
		background: #F0EFEA;
		border: 1rpx solid $bl-line;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ============ 订单 ============ */
	.od {
		margin-top: 20rpx;
		padding: 22rpx;
		display: flex;
		align-items: center;
	}

	.od-img {
		width: 120rpx;
		height: 120rpx;
		border-radius: $bl-r-sm;
		flex-shrink: 0;
		background: #F2F1EC;
	}

	.od-txt {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
	}

	.od-r1 {
		display: flex;
		align-items: baseline;
	}

	.od-n {
		flex: 1;
		font-size: 28rpx;
		font-weight: 700;
		color: $bl-ink;
		margin-right: 12rpx;
	}

	.od-code {
		font-size: 24rpx;
		color: $bl-gold;
		letter-spacing: 2rpx;
	}

	.od-r2 {
		margin-top: 8rpx;
		display: flex;
		align-items: center;
	}

	.od-ava {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
	}

	.od-user {
		margin-left: 10rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
	}

	.od-r3 {
		margin-top: 8rpx;
		display: flex;
		align-items: center;
	}

	.od-time {
		font-size: 21rpx;
		color: $bl-ink-4;
	}

	.od-left {
		margin-left: 16rpx;
		font-size: 21rpx;
		color: $bl-ink-4;

		&.urgent {
			color: $bl-red;
			font-weight: 700;
		}
	}

	.od-btn {
		margin-left: 16rpx;
		height: 66rpx;
		padding: 0 26rpx;
		border-radius: $bl-r-sm;
		background: linear-gradient(135deg, #F3D689, $bl-gold);
		display: flex;
		align-items: center;
		flex-shrink: 0;

		text {
			font-size: 26rpx;
			font-weight: 700;
			color: #3B2A06;
		}
	}
</style>
