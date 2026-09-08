<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="核销订单" bg="paper" :show-back="false" home="/pagesStore/home/home" />

		<!-- 店员无数据查看权限 -->
		<view v-if="!canView" class="deny">
			<view class="deny-ico">
				<bl-icon name="lock" :size="72" color="#B4BFB8" :weight="1.5" />
			</view>
			<text class="deny-t">店员账号无数据查看权限</text>
			<text class="deny-d">按门店权限体系，店员仅可执行扫码 / 输码核销，
				订单明细与统计数据仅店主及总部可见。</text>
			<view class="deny-btn bl-btn bl-btn-primary" @tap="toScan">
				<bl-icon name="scan-qr" :size="34" color="#FFF7E4" :weight="1.9" />
				<text style="margin-left:12rpx">去核销</text>
			</view>
		</view>

		<template v-else>
			<view class="bl-wrap">
				<view class="search">
					<bl-icon name="search" :size="30" color="#8B9A92" :weight="1.9" />
					<input class="search-in" v-model="kw" placeholder="搜索核销码 / 订单号 / 顾客"
						placeholder-class="search-ph" />
					<view v-if="kw" @tap="kw = ''">
						<bl-icon name="x-circle" :size="30" color="#C3CCC6" :weight="1.8" fill />
					</view>
				</view>
			</view>

			<view class="tabs">
				<view v-for="t in tabs" :key="t.k" class="tab" :class="{ on: tab === t.k }" @tap="tab = t.k">
					<text class="tab-t">{{ t.t }}</text>
					<text class="tab-n">{{ t.n }}</text>
					<view v-if="tab === t.k" class="tab-bar"></view>
				</view>
			</view>

			<view class="bl-wrap">
				<bl-empty v-if="!list.length" icon="clipboard-list" text="暂无订单" sub="换个筛选条件看看" />

				<view v-for="r in list" :key="r.id" class="od bl-card" @tap="detail(r)">
					<view class="od-h">
						<text class="od-id bl-num">{{ r.id }}</text>
						<text class="bl-tag" :class="stCls(r.status)">{{ stText(r.status) }}</text>
					</view>
					<view class="od-b">
						<image class="od-img" :src="r.prizeImg" mode="aspectFill" />
						<view class="od-txt">
							<text class="od-n bl-ellipsis">{{ r.prizeName }}</text>
							<view class="od-r">
								<text class="od-k">核销码</text>
								<text class="od-code bl-num">{{ r.code }}</text>
								<text class="od-price">{{ r.price }} 元档</text>
							</view>
							<view class="od-r">
								<image class="od-ava" :src="r.userAvatar" mode="aspectFill" />
								<text class="od-user">{{ r.userNick }} · {{ r.userPhone }}</text>
							</view>
						</view>
					</view>
					<view class="od-f">
						<view class="od-f-l">
							<bl-icon :name="r.status === 'verified' ? 'check-circle' : 'clock'" :size="24"
								:color="r.status === 'verified' ? '#2C7256' : '#8B9A92'" :weight="1.8" />
							<text class="od-f-t">
								{{ r.status === 'verified'
									? fmt(r.verifyAt, 'MM-DD HH:mm') + ' 由 ' + r.verifyByName + ' 核销'
									: fmt(r.redeemAt, 'MM-DD HH:mm') + ' 兑奖' }}
							</text>
						</view>
						<view v-if="r.status === 'pending'" class="od-btn" @tap.stop="verify(r)">
							<text>核销</text>
						</view>
						<view v-else class="od-more">
							<text>详情</text>
							<bl-icon name="chevron-right" :size="22" color="#8B9A92" :weight="2" />
						</view>
					</view>
				</view>

				<view v-if="list.length" class="exp" @tap="exportXls">
					<bl-icon name="file-spreadsheet" :size="30" color="#2C7256" :weight="1.8" />
					<text class="exp-t">导出当前筛选结果（Excel）</text>
				</view>
			</view>
		</template>

		<bl-storebar active="orders" />
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { fmt } from '@/utils/date.js'

	export default {
		data() {
			return { tab: 'pending', kw: '' }
		},
		computed: {
			canView() { return store.canViewData() },
			tabs() {
				return [
					{ k: 'pending', t: '未核销', n: store.storeOrders('pending').length },
					{ k: 'verified', t: '已核销', n: store.storeOrders('verified').length },
					{ k: 'all', t: '全部', n: store.storeOrders('all').length }
				]
			},
			list() {
				let l = store.storeOrders(this.tab)
				const k = this.kw.trim().toUpperCase()
				if (k) {
					l = l.filter(r =>
						r.code.indexOf(k) > -1 || r.id.indexOf(k) > -1 ||
						r.userNick.toUpperCase().indexOf(k) > -1 || r.userPhone.indexOf(k) > -1
					)
				}
				return l
			}
		},
		onShow() {
			store.tickExpire()
			if (!store.account()) uni.redirectTo({ url: '/pagesStore/login/login' })
		},
		methods: {
			fmt,
			stText(s) {
				return { pending: '待核销', verified: '已核销', expired: '已过期', frozen: '已冻结' }[s] || s
			},
			stCls(s) {
				return {
					pending: 'bl-tag-red', verified: 'bl-tag-green',
					expired: 'bl-tag-gray', frozen: 'bl-tag-blue'
				}[s] || 'bl-tag-gray'
			},
			detail(r) {
				uni.navigateTo({ url: '/pagesStore/orders/detail?id=' + r.id })
			},
			verify(r) {
				uni.navigateTo({ url: '/pagesStore/confirm/confirm?code=' + r.code })
			},
			toScan() {
				uni.redirectTo({ url: '/pagesStore/scan/scan' })
			},
			async exportXls() {
				try {
					await store.exportStoreOrders()
					uni.showToast({ title: '报表已生成', icon: 'success' })
				} catch (error) {
					uni.showToast({ title: error.message || '导出失败', icon: 'none' })
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
	}

	/* 无权限 */
	.deny {
		padding: 140rpx 60rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.deny-ico {
		width: 160rpx;
		height: 160rpx;
		border-radius: 50%;
		background: #fff;
		border: 1rpx dashed $bl-line;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.deny-t {
		margin-top: 30rpx;
		font-size: 32rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.deny-d {
		margin-top: 14rpx;
		font-size: 24rpx;
		color: $bl-ink-3;
		text-align: center;
		line-height: 1.7;
	}

	.deny-btn {
		margin-top: 44rpx;
		width: 100%;
	}

	/* 搜索 */
	.search {
		margin-top: 12rpx;
		height: 78rpx;
		background: #fff;
		border: 1rpx solid $bl-line;
		border-radius: $bl-r-pill;
		display: flex;
		align-items: center;
		padding: 0 24rpx;
	}

	.search-in {
		flex: 1;
		margin-left: 12rpx;
		font-size: 26rpx;
		color: $bl-ink;
	}

	.search-ph {
		color: $bl-ink-4;
		font-size: 25rpx;
	}

	/* 标签 */
	.tabs {
		margin-top: 24rpx;
		display: flex;
		padding: 0 $bl-pad;
		border-bottom: 1rpx solid $bl-line;
	}

	.tab {
		position: relative;
		display: flex;
		align-items: baseline;
		padding: 0 6rpx 18rpx;
		margin-right: 48rpx;
	}

	.tab-t {
		font-size: 29rpx;
		color: $bl-ink-3;
		font-weight: 600;
	}

	.tab.on .tab-t {
		font-size: 32rpx;
		color: $bl-ink;
		font-weight: 800;
	}

	.tab-n {
		margin-left: 8rpx;
		font-size: 21rpx;
		color: $bl-ink-4;
	}

	.tab-bar {
		position: absolute;
		left: 50%;
		bottom: -1rpx;
		width: 44rpx;
		height: 6rpx;
		margin-left: -22rpx;
		border-radius: 3rpx;
		background: linear-gradient(90deg, $bl-gold-2, $bl-gold);
	}

	/* 订单 */
	.od {
		margin-top: 20rpx;
		padding: 22rpx;
	}

	.od-h {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid $bl-line-2;
	}

	.od-id {
		font-size: 23rpx;
		color: $bl-ink-3;
		letter-spacing: 1rpx;
	}

	.od-b {
		display: flex;
		padding: 18rpx 0;
	}

	.od-img {
		width: 128rpx;
		height: 128rpx;
		border-radius: $bl-r-sm;
		flex-shrink: 0;
		background: #F2F1EC;
	}

	.od-txt {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
	}

	.od-n {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.od-r {
		margin-top: 8rpx;
		display: flex;
		align-items: center;
	}

	.od-k {
		font-size: 21rpx;
		color: $bl-ink-4;
		margin-right: 10rpx;
	}

	.od-code {
		font-size: 26rpx;
		color: $bl-gold;
		letter-spacing: 2rpx;
		margin-right: 14rpx;
	}

	.od-price {
		font-size: 20rpx;
		color: $bl-ink-4;
		padding: 2rpx 10rpx;
		background: #F2F1EC;
		border-radius: 4rpx;
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

	.od-f {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 16rpx;
		border-top: 1rpx dashed $bl-line;
	}

	.od-f-l {
		flex: 1;
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.od-f-t {
		margin-left: 8rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
	}

	.od-btn {
		height: 60rpx;
		padding: 0 26rpx;
		border-radius: $bl-r-sm;
		background: linear-gradient(135deg, #F3D689, $bl-gold);
		display: flex;
		align-items: center;

		text {
			font-size: 25rpx;
			font-weight: 700;
			color: #3B2A06;
		}
	}

	.od-more {
		display: flex;
		align-items: center;
		font-size: 22rpx;
		color: $bl-ink-3;
	}

	.exp {
		margin-top: 30rpx;
		height: 88rpx;
		border-radius: $bl-r-md;
		border: 1rpx dashed rgba(44, 114, 86, 0.4);
		background: rgba(231, 239, 234, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.exp-t {
		margin-left: 12rpx;
		font-size: 25rpx;
		color: $bl-ok;
		font-weight: 600;
	}
</style>
