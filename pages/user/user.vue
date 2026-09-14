<template>
	<view class="pg bl-paper-tex">
		<view class="top">
			<image class="top-bg" :src="cfg.homeBg" mode="aspectFill" />
			<view class="top-mask"></view>
			<bl-navbar title="个人中心" bg="transparent" :fixed="false" />
			<view class="top-in">
				<image v-if="logged && user.avatar" class="ava" :src="user.avatar" mode="aspectFill" />
				<view v-else class="ava ava-guest">
					<bl-icon name="user" :size="52" color="#E5C58A" :weight="1.7" />
				</view>
				<view v-if="logged" class="top-txt">
					<view class="top-n">
						<text class="top-n1">{{ user.nick }}</text>
						<text v-if="user.blocked" class="bl-tag bl-tag-red">已限制</text>
					</view>
					<text class="top-p">{{ user.phone }} · 参与于 {{ user.joinAt }}</text>
					<text class="top-o">OpenID {{ user.openid }}</text>
				</view>
				<view v-else class="top-txt">
					<view class="top-n">
						<text class="top-n1">未登录</text>
					</view>
					<text class="top-p">活动、奖品与门店无需登录即可浏览</text>
				</view>
			</view>
		</view>

		<view class="bl-wrap">
			<bl-guest v-if="!logged" icon="user" title="登录后管理我的账户" reason="profile"
				desc="兑奖记录、优惠券与领奖凭证集中在个人中心；不登录也可以继续浏览活动与门店。" />

			<view v-else class="stat bl-card">
				<view class="stat-i" @tap="goTab('/pages/record/record')">
					<text class="stat-n bl-num">{{ total }}</text>
					<text class="stat-l">累计兑奖</text>
				</view>
				<view class="stat-x"></view>
				<view class="stat-i" @tap="goTab('/pages/record/record')">
					<text class="stat-n bl-num" style="color:#94692B">{{ win }}</text>
					<text class="stat-l">中奖次数</text>
				</view>
				<view class="stat-x"></view>
				<view class="stat-i" @tap="goTab('/pages/record/record')">
					<text class="stat-n bl-num" style="color:#C0392B">{{ pending }}</text>
					<text class="stat-l">待核销</text>
				</view>
				<view class="stat-x"></view>
				<view class="stat-i" @tap="go('/pages/coupon/coupon')">
					<text class="stat-n bl-num">{{ coupons }}</text>
					<text class="stat-l">优惠券</text>
				</view>
			</view>

			<view class="menu bl-card">
				<view v-for="(m, i) in menus" :key="m.k" class="menu-i" @tap="onMenu(m)">
					<view class="menu-ico" :style="'background:' + m.bg">
						<bl-icon :name="m.icon" :size="34" :color="m.color" :weight="1.8" />
					</view>
					<text class="menu-t">{{ m.t }}</text>
					<text v-if="m.v" class="menu-v">{{ m.v }}</text>
					<bl-icon name="chevron-right" :size="26" color="#C3CCC6" :weight="2" />
					<view v-if="i < menus.length - 1" class="menu-line"></view>
				</view>
			</view>

			<view v-if="logged" class="logout bl-btn bl-btn-line" @tap="logout">
				<bl-icon name="log-out" :size="30" color="#60768C" :weight="1.9" />
				<text class="logout-t">退出登录</text>
			</view>

			<view class="foot">
				<text class="foot-t">{{ cfg.brand }} · 促销兑奖核销系统 v1.0.0</text>
			</view>
		</view>
	</view>
</template>

<script>
	import store from '@/store/index.js'

	export default {
		computed: {
			cfg() { return store.state.config },
			logged() { return store.isCustomerAuthenticated() },
			user() { return store.state.user },
			total() { return store.myRedeemList().length },
			win() { return store.myPrizeList('all').length },
			pending() { return store.myPrizeList('pending').length },
			coupons() { return store.validCoupons().length },
			menus() {
				return [
					{
						k: 'record', t: '我的兑奖记录', icon: 'ticket', color: '#94692B', bg: '#F6EEDC',
						v: this.logged ? this.total + ' 条' : '', url: '/pages/record/record', tab: true
					},
					{
						k: 'coupon', t: '我的优惠券', icon: 'ticket-percent', color: '#2F6D8C', bg: '#EAF2F6',
						v: this.logged ? this.coupons + ' 张可用' : '', url: '/pages/coupon/coupon'
					},
					{
						k: 'notice', t: '服务通知', icon: 'bell', color: '#C0392B', bg: '#FCEDEA',
						v: this.logged && store.unreadNotice() ? store.unreadNotice() + ' 条未读' : '', url: '/pages/notice/notice'
					},
					{
						k: 'store', t: '可核销门店', icon: 'store', color: '#4376AB', bg: '#E6EFF8',
						v: store.STORES.length + ' 家', url: '/pages/store/list'
					},
					{
						k: 'rules', t: '活动规则', icon: 'scroll-text', color: '#4F657D', bg: '#F0EFEA',
						v: '', url: '/pages/rules/rules', tab: true
					},
					{
						k: 'svc', t: '联系客服', icon: 'headphones', color: '#94692B', bg: '#F6EEDC',
						v: this.cfg.service.phone, url: ''
					}
				]
			}
		},
		onShow() {
			store.syncCustomer().catch(() => {})
		},
		methods: {
			go(url) { uni.navigateTo({ url }) },
			goTab(url) { uni.switchTab({ url }) },
			logout() {
				uni.showModal({
					title: '退出登录',
					content: '退出后仍可浏览活动、奖品与门店，再次兑奖时重新登录即可。',
					confirmText: '退出',
					success: res => {
						if (!res.confirm) return
						store.logoutCustomer()
						uni.showToast({ title: '已退出登录', icon: 'none' })
					}
				})
			},
			onMenu(m) {
				if (!m.url) {
					uni.makePhoneCall({ phoneNumber: this.cfg.service.phone, fail: () => {} })
					return
				}
				if (m.tab) uni.switchTab({ url: m.url })
				else uni.navigateTo({ url: m.url })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		padding-bottom: 60rpx;
	}

	.top {
		position: relative;
		padding-bottom: 40rpx;
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
		background: linear-gradient(175deg, rgba(9, 31, 59, 0.9), rgba(16, 46, 83, 0.94));
	}

	.top-in {
		position: relative;
		z-index: 2;
		padding: 16rpx $bl-pad 0;
		display: flex;
		align-items: center;
	}

	.ava {
		width: 128rpx;
		height: 128rpx;
		border-radius: 50%;
		border: 3rpx solid rgba(240, 215, 154, 0.55);
	}

	.ava-guest {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 248, 232, 0.12);
		border-style: dashed;
	}

	.top-txt {
		flex: 1;
		margin-left: 24rpx;
		min-width: 0;
	}

	.top-n {
		display: flex;
		align-items: center;
	}

	.top-n1 {
		font-size: 38rpx;
		font-weight: 800;
		color: #F5F9FD;
		margin-right: 14rpx;
	}

	.top-p {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: rgba(240, 215, 154, 0.8);
	}

	.top-o {
		display: block;
		margin-top: 4rpx;
		font-size: 20rpx;
		color: rgba(255, 246, 230, 0.42);
	}

	/* ============ 统计 ============ */
	.stat {
		margin-top: -20rpx;
		position: relative;
		z-index: 3;
		display: flex;
		align-items: center;
		padding: 28rpx 0;
	}

	.stat-i {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-n {
		font-size: 42rpx;
		color: $bl-green;
	}

	.stat-l {
		margin-top: 4rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
	}

	.stat-x {
		width: 1rpx;
		height: 44rpx;
		background: $bl-line;
	}

	/* ============ 菜单 ============ */
	.menu {
		margin-top: 26rpx;
		padding: 0 26rpx;
	}

	.menu-i {
		height: 118rpx;
		display: flex;
		align-items: center;
		position: relative;
	}

	.menu-ico {
		width: 68rpx;
		height: 68rpx;
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.menu-t {
		flex: 1;
		margin-left: 22rpx;
		font-size: 28rpx;
		color: $bl-ink;
		font-weight: 500;
	}

	.menu-v {
		font-size: 23rpx;
		color: $bl-ink-3;
		margin-right: 10rpx;
	}

	.menu-line {
		position: absolute;
		left: 90rpx;
		right: 0;
		bottom: 0;
		height: 1rpx;
		background: $bl-line-2;
	}

	.logout {
		margin-top: 32rpx;
		gap: 12rpx;
	}

	.logout-t {
		font-size: 29rpx;
		font-weight: 650;
		color: $bl-ink-2;
		letter-spacing: 2rpx;
	}

	.foot {
		margin-top: 40rpx;
		display: flex;
		justify-content: center;
	}

	.foot-t {
		font-size: 21rpx;
		color: $bl-ink-4;
	}
</style>
