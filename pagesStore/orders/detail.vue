<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="订单详情" bg="paper" home="/pagesStore/home/home" />

		<view v-if="rec" class="bl-wrap">
			<view class="st-bar" :class="stCls">
				<bl-icon :name="stIcon" :size="40" :color="stColor" :weight="1.8" />
				<view class="st-txt">
					<text class="st-t">{{ stText }}</text>
					<text class="st-d">{{ stDesc }}</text>
				</view>
			</view>

			<view class="card bl-card">
				<view class="pz">
					<image class="pz-img" :src="rec.prizeImg" mode="aspectFill" />
					<view class="pz-txt">
						<text class="pz-n">{{ rec.prizeName }}</text>
						<text class="pz-s">{{ rec.prizeLevel }} · {{ rec.prizeSpec }}</text>
						<view class="pz-v">
							<text class="pz-v1">价值</text>
							<text class="pz-v2 bl-num">¥{{ rec.prizeValue }}</text>
							<text class="bl-tag bl-tag-gray" style="margin-left:14rpx">{{ rec.prizeType }}</text>
						</view>
					</view>
				</view>
			</view>

			<view class="sec">
				<view class="bl-sec-bar"></view>
				<text class="sec-t">订单信息</text>
			</view>
			<view class="card bl-card">
				<view class="bl-kv"><text class="bl-kv-k">订单号</text>
					<text class="bl-kv-v bl-num">{{ rec.id }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">核销码</text>
					<text class="bl-kv-v bl-num">{{ rec.code }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">卡密批次</text>
					<text class="bl-kv-v">{{ rec.batchId }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">售价档位</text>
					<text class="bl-kv-v">{{ rec.price }} 元档</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">对应奖池</text>
					<text class="bl-kv-v">{{ poolName }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">兑奖时间</text>
					<text class="bl-kv-v">{{ fmt(rec.redeemAt, 'YYYY-MM-DD HH:mm:ss') }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">核销截止</text>
					<text class="bl-kv-v">{{ fmt(rec.expireAt, 'YYYY-MM-DD HH:mm') }}</text>
				</view>
				<view class="bl-kv"><text class="bl-kv-k">指定门店</text>
					<text class="bl-kv-v">{{ rec.preferStoreName || '未指定' }}</text>
				</view>
			</view>

			<view class="sec">
				<view class="bl-sec-bar"></view>
				<text class="sec-t">顾客信息</text>
			</view>
			<view class="card bl-card">
				<view class="user">
					<image class="user-ava" :src="rec.userAvatar" mode="aspectFill" />
					<view class="user-txt">
						<text class="user-n">{{ rec.userNick }}</text>
						<text class="user-p">{{ rec.userPhone }} · 用户 ID {{ rec.userId }}</text>
					</view>
				</view>
			</view>

			<template v-if="rec.status === 'verified'">
				<view class="sec">
					<view class="bl-sec-bar"></view>
					<text class="sec-t">核销留痕</text>
					<text class="sec-s">不可删除</text>
				</view>
				<view class="card bl-card">
					<view class="bl-kv"><text class="bl-kv-k">核销门店</text>
						<text class="bl-kv-v">{{ rec.storeName }}</text>
					</view>
					<view class="bl-kv"><text class="bl-kv-k">操作人</text>
						<text class="bl-kv-v">{{ rec.verifyByName }}</text>
					</view>
					<view class="bl-kv"><text class="bl-kv-k">核销时间</text>
						<text class="bl-kv-v">{{ fmt(rec.verifyAt, 'YYYY-MM-DD HH:mm:ss') }}</text>
					</view>
					<view class="bl-kv"><text class="bl-kv-k">定位信息</text>
						<text class="bl-kv-v">{{ rec.verifyPos }}</text>
					</view>
				</view>
			</template>

			<template v-if="rec.status === 'frozen'">
				<view class="frozen">
					<bl-icon name="lock" :size="30" color="#C0392B" :weight="1.8" />
					<text class="frozen-t">{{ rec.frozenReason }}</text>
				</view>
			</template>
		</view>

		<view v-if="rec && rec.status === 'pending'" class="bar">
			<view class="bar-r bl-btn bl-btn-primary" @tap="toVerify">
				<bl-icon name="badge-check" :size="34" color="#FFF7E4" :weight="1.9" />
				<text style="margin-left:12rpx">立即核销</text>
			</view>
		</view>
		<view v-if="rec && rec.status === 'pending'" class="bar-hold"></view>
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { fmt } from '@/utils/date.js'

	const ST = {
		pending: { t: '待核销', d: '顾客到店后请核对信息并当面交付奖品', i: 'clock', c: '#94692B', cls: 'wait' },
		verified: { t: '已核销', d: '奖品已发放，凭证已失效', i: 'badge-check', c: '#4376AB', cls: 'ok' },
		expired: { t: '已过期', d: '超过 30 天未核销，系统已自动失效', i: 'timer', c: '#60768C', cls: 'dead' },
		frozen: { t: '已冻结', d: '总部已冻结该订单，暂不可核销', i: 'lock', c: '#C0392B', cls: 'no' }
	}

	export default {
		data() {
			return { id: '' }
		},
		computed: {
			rec() { return store.storeRecordById(this.id) },
			cur() { return (this.rec && ST[this.rec.status]) || ST.pending },
			stText() { return this.cur.t },
			stDesc() { return this.cur.d },
			stIcon() { return this.cur.i },
			stColor() { return this.cur.c },
			stCls() { return this.cur.cls },
			poolName() {
				const p = this.rec && store.poolById(this.rec.poolId)
				return p ? p.name : '—'
			}
		},
		onLoad(opt) {
			this.id = (opt && opt.id) || ''
			/* 也支持直接用核销码打开（扫码链路会用到） */
			if (!this.id && opt && opt.code) {
				const r = store.storeRecordByCode(opt.code)
				if (r) this.id = r.id
			}
		},
		methods: {
			fmt,
			toVerify() {
				uni.navigateTo({ url: '/pagesStore/confirm/confirm?code=' + this.rec.code })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		padding-bottom: 60rpx;
	}

	.st-bar {
		margin-top: 16rpx;
		display: flex;
		align-items: center;
		padding: 24rpx 26rpx;
		border-radius: $bl-r-lg;
		border: 1rpx solid;

		&.wait {
			background: $bl-gold-lt;
			border-color: rgba(184, 137, 43, 0.26);
		}

		&.ok {
			background: $bl-green-lt;
			border-color: rgba(67, 118, 171, 0.26);
		}

		&.dead {
			background: #F2F1EC;
			border-color: $bl-line;
		}

		&.no {
			background: $bl-red-lt;
			border-color: rgba(192, 57, 43, 0.24);
		}
	}

	.st-txt {
		flex: 1;
		margin-left: 18rpx;
	}

	.st-t {
		display: block;
		font-size: 32rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.st-d {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: $bl-ink-2;
	}

	.sec {
		display: flex;
		align-items: center;
		margin: 30rpx 0 16rpx;
	}

	.sec-t {
		font-size: 28rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.sec-s {
		margin-left: auto;
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	.card {
		padding: 22rpx 26rpx;
	}

	.pz {
		display: flex;
	}

	.pz-img {
		width: 160rpx;
		height: 160rpx;
		border-radius: $bl-r-md;
		flex-shrink: 0;
		background: #F2F1EC;
	}

	.pz-txt {
		flex: 1;
		margin-left: 22rpx;
	}

	.pz-n {
		display: block;
		font-size: 34rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.pz-s {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: $bl-ink-4;
	}

	.pz-v {
		margin-top: 14rpx;
		display: flex;
		align-items: baseline;
	}

	.pz-v1 {
		font-size: 20rpx;
		color: $bl-ink-4;
		margin-right: 8rpx;
	}

	.pz-v2 {
		font-size: 32rpx;
		color: $bl-red;
	}

	.user {
		display: flex;
		align-items: center;
		padding: 8rpx 0;
	}

	.user-ava {
		width: 84rpx;
		height: 84rpx;
		border-radius: 50%;
	}

	.user-txt {
		flex: 1;
		margin-left: 20rpx;
	}

	.user-n {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.user-p {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
	}

	.frozen {
		margin-top: 24rpx;
		display: flex;
		align-items: flex-start;
		padding: 22rpx;
		background: $bl-red-lt;
		border: 1rpx solid rgba(192, 57, 43, 0.2);
		border-radius: $bl-r-md;
	}

	.frozen-t {
		flex: 1;
		margin-left: 12rpx;
		font-size: 23rpx;
		color: #8E2A20;
		line-height: 1.6;
	}

	.bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 90;
		display: flex;
		padding: 18rpx $bl-pad;
		background: rgba(255, 255, 255, 0.97);
		border-top: 1rpx solid $bl-line-2;
		padding-bottom: calc(18rpx + constant(safe-area-inset-bottom));
		padding-bottom: calc(18rpx + env(safe-area-inset-bottom));
	}

	.bar-r {
		flex: 1;
	}

	.bar-hold {
		height: calc(140rpx + constant(safe-area-inset-bottom));
		height: calc(140rpx + env(safe-area-inset-bottom));
	}
</style>
