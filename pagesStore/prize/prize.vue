<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="奖品库" bg="paper" home="/pagesStore/home/home" />

		<view class="bl-wrap">
			<!-- 权限说明 -->
			<view class="ro">
				<view class="ro-ico">
					<bl-icon name="eye" :size="34" color="#94692B" :weight="1.8" />
				</view>
				<view class="ro-txt">
					<text class="ro-t">只读模式</text>
					<text class="ro-d">奖品库由总部统一维护，全门店共用。门店无新增、修改、删除与库存调整权限。</text>
				</view>
			</view>

			<!-- 奖池筛选 -->
			<scroll-view class="chips" scroll-x show-scrollbar="false">
				<view class="chips-row">
					<view class="chip" :class="{ on: pool === 'all' }" @tap="pool = 'all'">
						<text>全部奖池</text>
					</view>
					<view v-for="p in pools" :key="p.id" class="chip" :class="{ on: pool === p.id }"
						@tap="pool = p.id">
						<view class="chip-dot" :style="'background:' + p.color"></view>
						<text>{{ p.name }}</text>
					</view>
				</view>
			</scroll-view>

			<!-- 库存预警 -->
			<view v-if="lowStock.length" class="warn">
				<bl-icon name="alert-triangle" :size="30" color="#C0392B" :weight="1.8" />
				<view class="warn-txt">
					<text class="warn-t">{{ lowStock.length }} 个奖项库存不足</text>
					<text class="warn-d">{{ lowStock.map(p => p.name).join('、') }} —— 库存耗尽后系统自动停发该奖项</text>
				</view>
			</view>

			<!-- 列表 -->
			<view v-for="p in list" :key="p.id" class="pz bl-card" :class="{ off: !p.on || p.stock <= 0 }">
				<image class="pz-img" :src="p.img" mode="aspectFill" />
				<view class="pz-txt">
					<view class="pz-r1">
						<text class="pz-n bl-ellipsis">{{ p.name }}</text>
						<text class="bl-tag" :class="tagCls(p)">{{ tagText(p) }}</text>
					</view>
					<text class="pz-s bl-ellipsis">{{ p.level }} · {{ p.spec }}</text>
					<view class="pz-r2">
						<text class="pz-v bl-num">¥{{ p.value }}</text>
						<view class="pz-pool" :style="'color:' + poolColor(p.pool)">
							<view class="pz-pool-dot" :style="'background:' + poolColor(p.pool)"></view>
							<text>{{ poolName(p.pool) }}</text>
						</view>
					</view>
					<view class="pz-stock">
						<view class="pz-track">
							<view class="pz-fill" :class="stockCls(p)"
								:style="'width:' + Math.round(p.stock / p.total * 100) + '%'"></view>
						</view>
						<text class="pz-stock-t">
							库存 <text class="pz-stock-n" :class="stockCls(p)">{{ p.stock }}</text> / {{ p.total }}
							· 已发 {{ p.sent }}
						</text>
					</view>
				</view>
			</view>

			<view class="tail">
				<bl-icon name="lock" :size="24" color="#9AAEBF" :weight="1.9" />
				<text class="tail-t">如需调整奖品或库存，请联系总部运营</text>
			</view>
		</view>

		<bl-storebar active="home" />
	</view>
</template>

<script>
	import store from '@/store/index.js'

	export default {
		data() {
			return { pool: 'all' }
		},
		computed: {
			pools() { return store.POOLS },
			all() { return store.prizeLib() },
			list() {
				if (this.pool === 'all') return this.all
				return this.all.filter(p => p.pool === this.pool)
			},
			lowStock() {
				return this.all.filter(p => p.on && p.stock <= 5)
			}
		},
		onShow() {
			if (!store.account()) uni.redirectTo({ url: '/pagesStore/login/login' })
		},
		methods: {
			poolName(id) {
				const p = store.poolById(id)
				return p ? p.name : ''
			},
			poolColor(id) {
				const p = store.poolById(id)
				return p ? p.color : '#60768C'
			},
			tagText(p) {
				if (!p.on) return '已下架'
				if (p.stock <= 0) return '已停发'
				if (p.stock <= 5) return '库存预警'
				return '在架'
			},
			tagCls(p) {
				if (!p.on) return 'bl-tag-gray'
				if (p.stock <= 0) return 'bl-tag-gray'
				if (p.stock <= 5) return 'bl-tag-red'
				return 'bl-tag-green'
			},
			stockCls(p) {
				if (p.stock <= 0) return 'out'
				if (p.stock <= 5) return 'low'
				return ''
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
	}

	.ro {
		margin-top: 14rpx;
		display: flex;
		align-items: flex-start;
		padding: 22rpx;
		background: $bl-gold-lt;
		border: 1rpx solid rgba(184, 137, 43, 0.24);
		border-radius: $bl-r-md;
	}

	.ro-ico {
		width: 64rpx;
		height: 64rpx;
		border-radius: $bl-r-sm;
		background: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.ro-txt {
		flex: 1;
		margin-left: 16rpx;
	}

	.ro-t {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #6B4E12;
	}

	.ro-d {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: #A07A2A;
		line-height: 1.55;
	}

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
		padding: 0 24rpx;
		border-radius: $bl-r-pill;
		background: #fff;
		border: 1rpx solid $bl-line;
		display: flex;
		align-items: center;
		margin-right: 14rpx;

		text {
			font-size: 24rpx;
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

	.chip-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 3rpx;
		margin-right: 10rpx;
	}

	.warn {
		margin-top: 22rpx;
		display: flex;
		align-items: flex-start;
		padding: 20rpx;
		background: $bl-red-lt;
		border: 1rpx solid rgba(192, 57, 43, 0.2);
		border-radius: $bl-r-md;
	}

	.warn-txt {
		flex: 1;
		margin-left: 14rpx;
	}

	.warn-t {
		display: block;
		font-size: 25rpx;
		font-weight: 700;
		color: #8E2A20;
	}

	.warn-d {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: #A8544A;
		line-height: 1.5;
	}

	.pz {
		margin-top: 20rpx;
		padding: 22rpx;
		display: flex;

		&.off {
			opacity: 0.62;
		}
	}

	.pz-img {
		width: 150rpx;
		height: 150rpx;
		border-radius: $bl-r-md;
		flex-shrink: 0;
		background: #F2F1EC;
	}

	.pz-txt {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
	}

	.pz-r1 {
		display: flex;
		align-items: center;
	}

	.pz-n {
		flex: 1;
		font-size: 29rpx;
		font-weight: 700;
		color: $bl-ink;
		margin-right: 12rpx;
	}

	.pz-s {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: $bl-ink-4;
	}

	.pz-r2 {
		margin-top: 8rpx;
		display: flex;
		align-items: center;
	}

	.pz-v {
		font-size: 28rpx;
		color: $bl-red;
		margin-right: 18rpx;
	}

	.pz-pool {
		display: flex;
		align-items: center;

		text {
			font-size: 20rpx;
		}
	}

	.pz-pool-dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 3rpx;
		margin-right: 6rpx;
	}

	.pz-stock {
		margin-top: 12rpx;
	}

	.pz-track {
		height: 10rpx;
		background: #F0EFEA;
		border-radius: 5rpx;
		overflow: hidden;
	}

	.pz-fill {
		height: 100%;
		border-radius: 5rpx;
		background: linear-gradient(90deg, #4376AB, #244D7A);

		&.low {
			background: linear-gradient(90deg, #E0A030, $bl-gold);
		}

		&.out {
			background: $bl-ink-4;
		}
	}

	.pz-stock-t {
		display: block;
		margin-top: 8rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	.pz-stock-n {
		font-weight: 800;
		color: $bl-ok;

		&.low {
			color: $bl-gold;
		}

		&.out {
			color: $bl-ink-3;
		}
	}

	.tail {
		margin-top: 34rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tail-t {
		margin-left: 8rpx;
		font-size: 21rpx;
		color: $bl-ink-4;
	}
</style>
