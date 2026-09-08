<template>
	<view class="pg bl-paper-tex">
		<view class="top">
			<image class="top-bg" :src="topBg" mode="aspectFill" />
			<view class="top-mask"></view>
			<bl-navbar title="门店中心" bg="transparent" :show-back="false" :fixed="false" />
			<view class="top-in">
				<image class="ava" :src="acc.avatar" mode="aspectFill" />
				<view class="top-txt">
					<view class="top-r1">
						<text class="top-n">{{ acc.name }}</text>
						<text class="bl-tag" :class="roleCls">{{ roleText }}</text>
					</view>
					<text class="top-s">{{ acc.account }} · {{ acc.phone }}</text>
					<text class="top-d">{{ st ? st.name : '总部超级核销账号' }}</text>
				</view>
			</view>
		</view>

		<view class="bl-wrap">
			<!-- 我的核销 -->
			<view class="mine bl-card">
				<view class="mine-i">
					<text class="mine-n bl-num">{{ myVerify }}</text>
					<text class="mine-l">我的核销</text>
				</view>
				<view class="mine-x"></view>
				<view class="mine-i">
					<text class="mine-n bl-num">{{ todayVerify }}</text>
					<text class="mine-l">今日核销</text>
				</view>
				<view class="mine-x"></view>
				<view class="mine-i">
					<text class="mine-n bl-num">{{ pending }}</text>
					<text class="mine-l">待核销</text>
				</view>
			</view>

			<!-- 门店信息 -->
			<view v-if="st" class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">门店信息</text>
				</view>
			</view>
			<view v-if="st" class="card bl-card">
				<view class="bl-kv"><text class="bl-kv-k">门店名称</text>
					<text class="bl-kv-v">{{ st.name }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">门店编号</text>
					<text class="bl-kv-v bl-num">{{ st.id }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">地址</text>
					<text class="bl-kv-v">{{ st.addr }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">营业时间</text>
					<text class="bl-kv-v">{{ st.open }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">联系电话</text>
					<text class="bl-kv-v">{{ st.phone }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">累计核销</text>
					<text class="bl-kv-v">{{ st.verified }} 单</text>
				</view>
			</view>

			<!-- 菜单 -->
			<view class="menu bl-card">
				<view v-for="(m, i) in menus" :key="m.k" class="menu-i" @tap="onMenu(m)">
					<view class="menu-ico" :style="'background:' + m.bg">
						<bl-icon :name="m.icon" :size="34" :color="m.locked ? '#B4BFB8' : m.color" :weight="1.8" />
					</view>
					<text class="menu-t" :class="{ off: m.locked }">{{ m.t }}</text>
					<view v-if="m.locked" class="menu-lock">
						<bl-icon name="lock" :size="22" color="#B4BFB8" :weight="2" />
					</view>
					<bl-icon v-else name="chevron-right" :size="26" color="#C3CCC6" :weight="2" />
					<view v-if="i < menus.length - 1" class="menu-line"></view>
				</view>
			</view>

			<!-- 权限说明 -->
			<view class="perm">
				<view class="perm-h">
					<bl-icon name="shield-check" :size="28" color="#2C7256" :weight="1.8" />
					<text class="perm-h-t">当前账号权限</text>
				</view>
				<view class="perm-g">
					<view v-for="(p, i) in perms" :key="i" class="perm-i" :class="{ no: !p.on }">
						<bl-icon :name="p.on ? 'check-circle' : 'x-circle'" :size="26"
							:color="p.on ? '#2C7256' : '#C3CCC6'" :weight="1.8" />
						<text class="perm-t">{{ p.t }}</text>
					</view>
				</view>
			</view>

			<view class="out bl-btn bl-btn-line" @tap="logout">
				<bl-icon name="log-out" :size="32" color="#C0392B" :weight="1.9" />
				<text class="out-t">退出登录</text>
			</view>

			<view class="back" @tap="toC">
				<text>返回顾客端小程序</text>
			</view>
		</view>

		<bl-storebar active="me" />
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { publicAsset } from '@/utils/api.js'
	import { todayStart } from '@/utils/date.js'

	export default {
		computed: {
			topBg() { return (this.st && this.st.img) || publicAsset('/assets/store-1.jpg') },
			acc() { return store.account() || {} },
			st() { return store.myStore() },
			canView() { return store.canViewData() },
			roleText() {
				return { owner: '店主', staff: '店员', hq: '总部' }[this.acc.role] || ''
			},
			roleCls() {
				return { owner: 'bl-tag-gold', staff: 'bl-tag-green', hq: 'bl-tag-red' }[this.acc.role] || 'bl-tag-gray'
			},
			myLogs() {
				return store.state.logs.filter(l => l.byId === this.acc.id && l.type === 'verify')
			},
			myVerify() { return this.myLogs.length },
			todayVerify() { return this.myLogs.filter(l => l.at >= todayStart()).length },
			pending() { return store.storePendingCount() },
			menus() {
				const lock = !this.canView
				return [
					{ k: 'orders', t: '核销订单', icon: 'clipboard-list', color: '#2C7256', bg: '#E7EFEA', url: '/pagesStore/orders/orders', locked: lock },
					{ k: 'stats', t: '门店数据统计', icon: 'bar-chart', color: '#2F6D8C', bg: '#EAF2F6', url: '/pagesStore/stats/stats', locked: lock },
					{ k: 'logs', t: '核销日志', icon: 'history', color: '#B8892B', bg: '#FAF1DC', url: '/pagesStore/logs/logs', locked: lock },
					{ k: 'prize', t: '奖品库（只读）', icon: 'gift', color: '#C0392B', bg: '#FCEDEA', url: '/pagesStore/prize/prize', locked: false },
					{ k: 'staff', t: '员工管理', icon: 'users', color: '#4A5C52', bg: '#F0EFEA', url: '/pagesStore/staff/staff', locked: this.acc.role === 'staff' },
					{ k: 'switch', t: '切换登录账号', icon: 'refresh-cw', color: '#0E3B2E', bg: '#E7EFEA', url: '/pagesStore/login/login', locked: false }
				]
			},
			perms() {
				const r = this.acc.role
				return [
					{ t: '扫码 / 输码核销', on: true },
					{ t: '查看本店订单', on: r !== 'staff' },
					{ t: '查看统计与日志', on: r !== 'staff' },
					{ t: '导出 Excel 报表', on: r !== 'staff' },
					{ t: '奖品库编辑', on: false },
					{ t: '代其他门店核销', on: r === 'hq' }
				]
			}
		},
		onShow() {
			if (!store.account()) uni.redirectTo({ url: '/pagesStore/login/login' })
		},
		methods: {
			onMenu(m) {
				if (m.locked) {
					uni.showToast({ title: '店员账号无该权限', icon: 'none' })
					return
				}
				if (m.k === 'switch') {
					uni.redirectTo({ url: m.url })
					return
				}
				uni.navigateTo({ url: m.url })
			},
			logout() {
				uni.showModal({
					title: '退出登录',
					content: '确定退出当前门店账号？',
					confirmColor: '#C0392B',
					success: r => {
						if (!r.confirm) return
						store.logout()
						uni.redirectTo({ url: '/pagesStore/login/login' })
					}
				})
			},
			toC() {
				uni.reLaunch({ url: '/pages/index/index' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
	}

	.top {
		position: relative;
		padding-bottom: 46rpx;
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
		padding: 16rpx $bl-pad 0;
		display: flex;
		align-items: center;
	}

	.ava {
		width: 120rpx;
		height: 120rpx;
		border-radius: $bl-r-md;
		border: 2rpx solid rgba(240, 215, 154, 0.45);
	}

	.top-txt {
		flex: 1;
		margin-left: 22rpx;
		min-width: 0;
	}

	.top-r1 {
		display: flex;
		align-items: center;
	}

	.top-n {
		font-size: 36rpx;
		font-weight: 800;
		color: #FFF6E6;
		margin-right: 12rpx;
	}

	.top-s {
		display: block;
		margin-top: 6rpx;
		font-size: 21rpx;
		color: rgba(240, 215, 154, 0.75);
	}

	.top-d {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: rgba(255, 246, 230, 0.5);
	}

	.mine {
		margin-top: -22rpx;
		position: relative;
		z-index: 3;
		display: flex;
		align-items: center;
		padding: 26rpx 0;
	}

	.mine-i {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.mine-n {
		font-size: 42rpx;
		color: $bl-green;
	}

	.mine-l {
		margin-top: 2rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
	}

	.mine-x {
		width: 1rpx;
		height: 44rpx;
		background: $bl-line;
	}

	.card {
		padding: 20rpx 26rpx;
	}

	.menu {
		margin-top: 26rpx;
		padding: 0 26rpx;
	}

	.menu-i {
		height: 112rpx;
		display: flex;
		align-items: center;
		position: relative;
	}

	.menu-ico {
		width: 64rpx;
		height: 64rpx;
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.menu-t {
		flex: 1;
		margin-left: 20rpx;
		font-size: 28rpx;
		color: $bl-ink;

		&.off {
			color: $bl-ink-4;
		}
	}

	.menu-lock {
		width: 40rpx;
		height: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.menu-line {
		position: absolute;
		left: 84rpx;
		right: 0;
		bottom: 0;
		height: 1rpx;
		background: $bl-line-2;
	}

	.perm {
		margin-top: 26rpx;
		padding: 24rpx 26rpx;
		background: rgba(255, 255, 255, 0.75);
		border: 1rpx solid $bl-line;
		border-radius: $bl-r-lg;
	}

	.perm-h {
		display: flex;
		align-items: center;
	}

	.perm-h-t {
		margin-left: 10rpx;
		font-size: 27rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.perm-g {
		margin-top: 16rpx;
		display: flex;
		flex-wrap: wrap;
	}

	.perm-i {
		width: 50%;
		display: flex;
		align-items: center;
		padding: 10rpx 0;
	}

	.perm-t {
		margin-left: 10rpx;
		font-size: 23rpx;
		color: $bl-ink-2;
	}

	.perm-i.no .perm-t {
		color: $bl-ink-4;
	}

	.out {
		margin-top: 30rpx;
	}

	.out-t {
		margin-left: 12rpx;
		color: $bl-red;
	}

	.back {
		margin-top: 26rpx;
		display: flex;
		justify-content: center;

		text {
			font-size: 23rpx;
			color: $bl-ink-3;
		}
	}
</style>
