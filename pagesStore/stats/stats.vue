<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="门店数据" bg="paper" home="/pagesStore/home/home">
			<template #right>
				<view class="nav-r" @tap="exportXls">
					<bl-icon name="download" :size="32" color="#16261F" :weight="1.8" />
				</view>
			</template>
		</bl-navbar>

		<view v-if="!canView" class="deny">
			<bl-icon name="lock" :size="72" color="#B4BFB8" :weight="1.5" />
			<text class="deny-t">店员账号无数据查看权限</text>
		</view>

		<template v-else>
			<view class="bl-wrap">
				<!-- ============ 今日 ============ -->
				<view class="today">
					<view class="today-h">
						<text class="today-h-t">{{ storeName }}</text>
						<text class="today-h-d">{{ today }}</text>
					</view>
					<view class="today-g">
						<view class="today-i">
							<text class="today-n bl-num">{{ st.todayRedeem }}</text>
							<text class="today-l">今日兑奖量</text>
						</view>
						<view class="today-i">
							<text class="today-n bl-num">{{ st.todayWin }}</text>
							<text class="today-l">今日中奖数</text>
						</view>
						<view class="today-i">
							<text class="today-n bl-num">{{ st.todayVerify }}</text>
							<text class="today-l">今日核销</text>
						</view>
						<view class="today-i">
							<text class="today-n bl-num">{{ st.winRate }}%</text>
							<text class="today-l">中奖率</text>
						</view>
					</view>
				</view>

				<!-- ============ 累计 ============ -->
				<view class="cards">
					<view class="c bl-card">
						<view class="c-ico" style="background:#E7EFEA">
							<bl-icon name="badge-check" :size="34" color="#2C7256" :weight="1.8" />
						</view>
						<text class="c-n bl-num">{{ st.totalVerify }}</text>
						<text class="c-l">累计核销量</text>
					</view>
					<view class="c bl-card">
						<view class="c-ico" style="background:#FCEDEA">
							<bl-icon name="clock" :size="34" color="#C0392B" :weight="1.8" />
						</view>
						<text class="c-n bl-num">{{ st.pending }}</text>
						<text class="c-l">待核销</text>
					</view>
					<view class="c bl-card">
						<view class="c-ico" style="background:#FAF1DC">
							<bl-icon name="coins" :size="34" color="#B8892B" :weight="1.8" />
						</view>
						<text class="c-n bl-num">¥{{ st.totalValue }}</text>
						<text class="c-l">累计奖品价值</text>
					</view>
				</view>

				<!-- ============ 趋势 ============ -->
				<view class="bl-sec">
					<view class="bl-sec-l">
						<view class="bl-sec-bar"></view>
						<text class="bl-sec-t">近 7 日核销趋势</text>
					</view>
					<text class="bl-sec-more">单位：单</text>
				</view>
				<view class="chart bl-card">
					<view class="chart-body">
						<view v-for="(d, i) in trend" :key="i" class="bar-i">
							<text class="bar-v bl-num">{{ d.value }}</text>
							<view class="bar-track">
								<view class="bar-fill" :class="{ today: d.today }"
									:style="'height:' + barH(d.value) + '%'"></view>
							</view>
							<text class="bar-l" :class="{ today: d.today }">{{ d.label }}</text>
						</view>
					</view>
				</view>

				<!-- ============ 奖品分布 ============ -->
				<view class="bl-sec">
					<view class="bl-sec-l">
						<view class="bl-sec-bar"></view>
						<text class="bl-sec-t">已核销奖品分布</text>
					</view>
				</view>
				<view class="dist bl-card">
					<bl-empty v-if="!dist.length" icon="pie-chart" text="暂无核销数据" />
					<view v-for="(d, i) in dist" :key="i" class="dist-i">
						<image class="dist-img" :src="d.img" mode="aspectFill" />
						<view class="dist-txt">
							<view class="dist-r1">
								<text class="dist-n bl-ellipsis">{{ d.name }}</text>
								<text class="dist-c bl-num">{{ d.count }} 件</text>
							</view>
							<view class="dist-track">
								<view class="dist-fill" :style="'width:' + (d.count / dist[0].count * 100) + '%'"></view>
							</view>
						</view>
					</view>
				</view>

				<!-- ============ 排行榜 ============ -->
				<view class="bl-sec">
					<view class="bl-sec-l">
						<view class="bl-sec-bar"></view>
						<text class="bl-sec-t">门店业绩排行</text>
					</view>
					<text class="bl-sec-more">全平台</text>
				</view>
				<view class="rank bl-card">
					<view v-for="(s, i) in rank" :key="s.id" class="rank-i" :class="{ mine: s.mine }">
						<view class="rank-no" :class="'no' + (i + 1)">
							<text>{{ i + 1 }}</text>
						</view>
						<image class="rank-img" :src="s.img" mode="aspectFill" />
						<view class="rank-txt">
							<view class="rank-r1">
								<text class="rank-n bl-ellipsis">{{ s.name }}</text>
								<text v-if="s.mine" class="bl-tag bl-tag-gold">本店</text>
							</view>
							<text class="rank-d">今日 +{{ s.today }} 单</text>
						</view>
						<text class="rank-v bl-num">{{ s.total }}</text>
					</view>
				</view>

				<view class="exp" @tap="exportXls">
					<bl-icon name="file-spreadsheet" :size="32" color="#2C7256" :weight="1.8" />
					<text class="exp-t">导出门店数据报表（Excel）</text>
				</view>
			</view>
		</template>

		<bl-storebar active="home" />
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { fmt } from '@/utils/date.js'

	export default {
		computed: {
			canView() { return store.canViewData() },
			st() { return store.storeStats() },
			trend() { return store.weekTrend() },
			rank() { return store.storeRank() },
			today() { return fmt(Date.now(), 'YYYY 年 M 月 D 日') },
			storeName() {
				const s = store.myStore()
				return s ? s.name : '全平台'
			},
			max() {
				return Math.max.apply(null, this.trend.map(d => d.value).concat([1]))
			},
			dist() {
				const map = {}
				store.storeOrders('verified').forEach(r => {
					if (!map[r.prizeId]) map[r.prizeId] = { name: r.prizeName, img: r.prizeImg, count: 0 }
					map[r.prizeId].count++
				})
				return Object.keys(map).map(k => map[k]).sort((a, b) => b.count - a.count).slice(0, 6)
			}
		},
		onShow() {
			if (!store.account()) uni.redirectTo({ url: '/pagesStore/login/login' })
		},
		methods: {
			barH(v) {
				return Math.max(6, Math.round((v / this.max) * 100))
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

	.nav-r {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.deny {
		padding: 200rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.deny-t {
		margin-top: 24rpx;
		font-size: 28rpx;
		color: $bl-ink-3;
	}

	/* 今日 */
	.today {
		margin-top: 14rpx;
		border-radius: $bl-r-lg;
		background: linear-gradient(120deg, #14332A 0%, #0B241C 100%);
		padding: 28rpx 26rpx 24rpx;
		box-shadow: $bl-sd-green;
	}

	.today-h {
		display: flex;
		align-items: baseline;
	}

	.today-h-t {
		flex: 1;
		font-size: 28rpx;
		font-weight: 700;
		color: #FFF6E6;
	}

	.today-h-d {
		font-size: 21rpx;
		color: rgba(240, 215, 154, 0.6);
	}

	.today-g {
		margin-top: 24rpx;
		display: flex;
		flex-wrap: wrap;
	}

	.today-i {
		width: 25%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.today-n {
		font-size: 44rpx;
		color: #F0D79A;
	}

	.today-l {
		margin-top: 2rpx;
		font-size: 19rpx;
		color: rgba(255, 246, 230, 0.5);
	}

	/* 卡片 */
	.cards {
		margin-top: 22rpx;
		display: flex;
	}

	.c {
		flex: 1;
		margin-right: 18rpx;
		padding: 24rpx 18rpx;
		display: flex;
		flex-direction: column;
		align-items: center;

		&:last-child {
			margin-right: 0;
		}
	}

	.c-ico {
		width: 68rpx;
		height: 68rpx;
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.c-n {
		margin-top: 14rpx;
		font-size: 36rpx;
		color: $bl-ink;
	}

	.c-l {
		margin-top: 2rpx;
		font-size: 20rpx;
		color: $bl-ink-3;
	}

	/* 柱状图 */
	.chart {
		padding: 28rpx 20rpx 20rpx;
	}

	.chart-body {
		height: 320rpx;
		display: flex;
		align-items: flex-end;
	}

	.bar-i {
		flex: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.bar-v {
		font-size: 21rpx;
		color: $bl-ink-3;
		margin-bottom: 8rpx;
	}

	.bar-track {
		flex: 1;
		width: 44rpx;
		background: #F2F1EC;
		border-radius: 8rpx;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
	}

	.bar-fill {
		width: 100%;
		border-radius: 8rpx;
		background: linear-gradient(180deg, #2C7256, #17553F);

		&.today {
			background: linear-gradient(180deg, #F3D689, $bl-gold);
		}
	}

	.bar-l {
		margin-top: 10rpx;
		font-size: 19rpx;
		color: $bl-ink-4;

		&.today {
			color: $bl-gold;
			font-weight: 700;
		}
	}

	/* 分布 */
	.dist {
		padding: 20rpx 26rpx;
	}

	.dist-i {
		display: flex;
		align-items: center;
		padding: 16rpx 0;
	}

	.dist-img {
		width: 72rpx;
		height: 72rpx;
		border-radius: $bl-r-xs;
		flex-shrink: 0;
		background: #F2F1EC;
	}

	.dist-txt {
		flex: 1;
		margin-left: 18rpx;
		min-width: 0;
	}

	.dist-r1 {
		display: flex;
		align-items: baseline;
	}

	.dist-n {
		flex: 1;
		font-size: 25rpx;
		color: $bl-ink;
	}

	.dist-c {
		font-size: 23rpx;
		color: $bl-gold;
	}

	.dist-track {
		margin-top: 8rpx;
		height: 12rpx;
		background: #F2F1EC;
		border-radius: 6rpx;
		overflow: hidden;
	}

	.dist-fill {
		height: 100%;
		border-radius: 6rpx;
		background: linear-gradient(90deg, #2C7256, #17553F);
	}

	/* 排行 */
	.rank {
		padding: 10rpx 26rpx;
	}

	.rank-i {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid $bl-line-2;

		&:last-child {
			border-bottom: none;
		}

		&.mine {
			background: rgba(250, 241, 220, 0.5);
			margin: 0 -26rpx;
			padding-left: 26rpx;
			padding-right: 26rpx;
		}
	}

	.rank-no {
		width: 44rpx;
		height: 44rpx;
		border-radius: $bl-r-xs;
		background: #F2F1EC;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		text {
			font-size: 23rpx;
			font-weight: 800;
			color: $bl-ink-3;
		}

		&.no1 {
			background: linear-gradient(135deg, #F3D689, $bl-gold);

			text {
				color: #43300A;
			}
		}

		&.no2 {
			background: #DDE3E0;
		}

		&.no3 {
			background: #EBDCC6;
		}
	}

	.rank-img {
		width: 68rpx;
		height: 52rpx;
		border-radius: 6rpx;
		margin-left: 18rpx;
		flex-shrink: 0;
	}

	.rank-txt {
		flex: 1;
		margin-left: 18rpx;
		min-width: 0;
	}

	.rank-r1 {
		display: flex;
		align-items: center;
	}

	.rank-n {
		font-size: 26rpx;
		font-weight: 600;
		color: $bl-ink;
		margin-right: 12rpx;
		max-width: 300rpx;
	}

	.rank-d {
		display: block;
		margin-top: 2rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	.rank-v {
		font-size: 32rpx;
		color: $bl-green;
	}

	.exp {
		margin-top: 30rpx;
		height: 92rpx;
		border-radius: $bl-r-md;
		border: 1rpx dashed rgba(44, 114, 86, 0.4);
		background: rgba(231, 239, 234, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.exp-t {
		margin-left: 12rpx;
		font-size: 26rpx;
		color: $bl-ok;
		font-weight: 600;
	}
</style>
