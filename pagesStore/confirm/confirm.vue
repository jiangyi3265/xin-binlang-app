<template>
	<view class="pg bl-paper-tex">
		<bl-navbar :title="done ? '核销成功' : '核销确认'" bg="paper" home="/pagesStore/home/home" />

		<view class="bl-wrap">
			<!-- ============ 结果条 ============ -->
			<view class="hd" :class="hdCls">
				<view class="hd-ico">
					<bl-icon :name="hdIcon" :size="52" :color="hdColor" :weight="1.8" />
				</view>
				<view class="hd-txt">
					<text class="hd-t">{{ hdTitle }}</text>
					<text class="hd-d">{{ hdDesc }}</text>
				</view>
			</view>

			<!-- ============ 订单卡 ============ -->
			<view v-if="rec" class="od bl-card">
				<view class="od-top">
					<image class="od-img" :src="rec.prizeImg" mode="aspectFill" />
					<view class="od-txt">
						<view class="od-lv">{{ rec.prizeLevel }} · {{ poolName }}</view>
						<text class="od-n">{{ rec.prizeName }}</text>
						<text class="od-spec">{{ rec.prizeSpec }}</text>
						<view class="od-v">
							<text class="od-v1">奖品价值</text>
							<text class="od-v2 bl-num">¥{{ rec.prizeValue }}</text>
						</view>
					</view>
				</view>

				<view class="bl-dash od-dash"></view>

				<view class="bl-kv">
					<text class="bl-kv-k">核销码</text>
					<text class="bl-kv-v bl-num">{{ rec.code }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">订单号</text>
					<text class="bl-kv-v bl-num">{{ rec.id }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">顾客</text>
					<text class="bl-kv-v">{{ rec.userNick }}（{{ rec.userPhone }}）</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">所属批次</text>
					<text class="bl-kv-v">{{ rec.batchId }} · {{ rec.price }} 元档</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">兑奖时间</text>
					<text class="bl-kv-v">{{ fmt(rec.redeemAt, 'YYYY-MM-DD HH:mm') }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">核销截止</text>
					<text class="bl-kv-v" :class="{ warn: !done && urgent }">
						{{ fmt(rec.expireAt, 'YYYY-MM-DD HH:mm') }}
						<text v-if="!done && rec.status === 'pending'">（剩 {{ daysLeft(rec.expireAt) }} 天）</text>
					</text>
				</view>
			</view>

			<!-- ============ 核销留痕 ============ -->
			<view v-if="done || (rec && rec.status === 'verified')" class="tr bl-card">
				<view class="tr-h">
					<view class="bl-sec-bar"></view>
					<text class="tr-h-t">核销留痕</text>
					<text class="tr-h-s">日志永久保存，不可删除</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">核销门店</text>
					<text class="bl-kv-v">{{ rec.storeName }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">操作人</text>
					<text class="bl-kv-v">{{ rec.verifyByName }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">核销时间</text>
					<text class="bl-kv-v">{{ fmt(rec.verifyAt, 'YYYY-MM-DD HH:mm:ss') }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">定位信息</text>
					<text class="bl-kv-v">{{ rec.verifyPos }}</text>
				</view>
			</view>

			<!-- ============ 待核销时的提示 ============ -->
			<view v-if="canVerify" class="warn-box">
				<bl-icon name="alert-circle" :size="28" color="#B8892B" :weight="1.8" />
				<text class="warn-t">请当面将奖品交付顾客后再点击核销，核销后凭证立即失效且不可撤销。</text>
			</view>
		</view>

		<!-- ============ 底部操作 ============ -->
		<view class="bar">
			<template v-if="canVerify">
				<view class="bar-l bl-btn bl-btn-line" @tap="back">
					<text>返回</text>
				</view>
				<view class="bar-r bl-btn bl-btn-primary" @tap="doVerify">
					<bl-icon name="badge-check" :size="34" color="#FFF7E4" :weight="1.9" />
					<text class="bar-r-t">确认核销</text>
				</view>
			</template>
			<template v-else>
				<view class="bar-l bl-btn bl-btn-line" @tap="toScan">
					<text>继续扫码</text>
				</view>
				<view class="bar-r bl-btn bl-btn-primary" @tap="toHome">
					<text>回到工作台</text>
				</view>
			</template>
		</view>
		<view class="bar-hold"></view>
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { fmt, daysLeft } from '@/utils/date.js'

	const ERR = {
		ERR_FORMAT: { t: '核销码格式有误', i: 'alert-circle' },
		ERR_NOT_FOUND: { t: '未查询到订单', i: 'x-circle' },
		ERR_NOT_WIN: { t: '该码未中奖', i: 'info' },
		ERR_DUP: { t: '重复核销已拦截', i: 'ban' },
		ERR_EXPIRED: { t: '凭证已过期', i: 'timer' },
		ERR_FROZEN: { t: '订单已被冻结', i: 'lock' },
		ERR_AUTH: { t: '请先登录', i: 'lock' }
	}

	export default {
		data() {
			return { code: '', res: {}, done: false }
		},
		computed: {
			rec() { return this.res.record || null },
			canVerify() { return !this.done && this.res.ok },
			urgent() { return this.rec ? daysLeft(this.rec.expireAt) <= 3 : false },
			poolName() {
				const p = this.rec && store.poolById(this.rec.poolId)
				return p ? p.name : '—'
			},
			hdCls() {
				if (this.done) return 'ok'
				return this.res.ok ? 'ready' : 'no'
			},
			hdIcon() {
				if (this.done) return 'badge-check'
				if (this.res.ok) return 'shield-check'
				return (ERR[this.res.code] || ERR.ERR_NOT_FOUND).i
			},
			hdColor() {
				if (this.done) return '#2C7256'
				return this.res.ok ? '#B8892B' : '#C0392B'
			},
			hdTitle() {
				if (this.done) return '核销成功'
				if (this.res.ok) return '凭证有效，待核销'
				return (ERR[this.res.code] || ERR.ERR_NOT_FOUND).t
			},
			hdDesc() {
				if (this.done) return '奖品已发放，订单状态已更新为「已核销」'
				if (this.res.ok) return '请核对奖品信息后完成核销'
				return this.res.msg || ''
			}
		},
		async onLoad(opt) {
			this.code = ((opt && opt.code) || '').toUpperCase()
			this.res = await store.findForVerify(this.code)
		},
		methods: {
			fmt,
			daysLeft,
			doVerify() {
				const a = store.account()
				uni.showModal({
					title: '确认核销',
					content: '确认将「' + this.rec.prizeName + '」交付给顾客 ' + this.rec.userNick + '？',
					confirmText: '确认核销',
					confirmColor: '#0E3B2E',
					success: async m => {
						if (!m.confirm) return
						const r = await store.verify(this.code)
						if (r.ok) {
							this.res = r
							this.done = true
							uni.vibrateShort && uni.vibrateShort({})
							uni.showToast({ title: '核销成功', icon: 'success' })
						} else {
							this.res = r
							uni.showToast({ title: r.msg, icon: 'none' })
						}
					}
				})
			},
			back() { uni.navigateBack() },
			toScan() { uni.redirectTo({ url: '/pagesStore/scan/scan' }) },
			toHome() { uni.redirectTo({ url: '/pagesStore/home/home' }) }
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
	}

	/* ============ 结果条 ============ */
	.hd {
		margin-top: 16rpx;
		display: flex;
		align-items: center;
		padding: 28rpx 26rpx;
		border-radius: $bl-r-lg;
		border: 1rpx solid;

		&.ready {
			background: $bl-gold-lt;
			border-color: rgba(184, 137, 43, 0.28);
		}

		&.ok {
			background: $bl-green-lt;
			border-color: rgba(44, 114, 86, 0.28);
		}

		&.no {
			background: $bl-red-lt;
			border-color: rgba(192, 57, 43, 0.24);
		}
	}

	.hd-ico {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.86);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.hd-txt {
		flex: 1;
		margin-left: 22rpx;
		min-width: 0;
	}

	.hd-t {
		display: block;
		font-size: 34rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.hd-d {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: $bl-ink-2;
		line-height: 1.55;
	}

	/* ============ 订单 ============ */
	.od {
		margin-top: 24rpx;
		padding: 26rpx;
	}

	.od-top {
		display: flex;
	}

	.od-img {
		width: 176rpx;
		height: 176rpx;
		border-radius: $bl-r-md;
		flex-shrink: 0;
		background: #F2F1EC;
	}

	.od-txt {
		flex: 1;
		margin-left: 22rpx;
		min-width: 0;
	}

	.od-lv {
		display: inline-block;
		height: 36rpx;
		line-height: 36rpx;
		padding: 0 14rpx;
		border-radius: 6rpx;
		background: $bl-gold-lt;
		color: $bl-gold;
		font-size: 20rpx;
		font-weight: 700;
		border: 1rpx solid rgba(184, 137, 43, 0.3);
	}

	.od-n {
		display: block;
		margin-top: 12rpx;
		font-size: 36rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.od-spec {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: $bl-ink-4;
	}

	.od-v {
		margin-top: 12rpx;
		display: flex;
		align-items: baseline;
	}

	.od-v1 {
		font-size: 20rpx;
		color: $bl-ink-4;
		margin-right: 8rpx;
	}

	.od-v2 {
		font-size: 32rpx;
		color: $bl-red;
	}

	.od-dash {
		margin: 24rpx 0 8rpx;
	}

	.warn {
		color: $bl-red !important;
	}

	/* ============ 留痕 ============ */
	.tr {
		margin-top: 24rpx;
		padding: 26rpx;
	}

	.tr-h {
		display: flex;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.tr-h-t {
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.tr-h-s {
		margin-left: auto;
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	/* ============ 提示 ============ */
	.warn-box {
		margin-top: 24rpx;
		display: flex;
		align-items: flex-start;
		padding: 20rpx 22rpx;
		background: $bl-gold-lt;
		border: 1rpx solid rgba(184, 137, 43, 0.22);
		border-radius: $bl-r-md;
	}

	.warn-t {
		flex: 1;
		margin-left: 12rpx;
		font-size: 22rpx;
		color: #8A6520;
		line-height: 1.6;
	}

	/* ============ 底栏 ============ */
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
		box-shadow: 0 -6rpx 24rpx rgba(22, 38, 31, 0.05);
		padding-bottom: calc(18rpx + constant(safe-area-inset-bottom));
		padding-bottom: calc(18rpx + env(safe-area-inset-bottom));
	}

	.bar-l {
		width: 220rpx;
		margin-right: 20rpx;
	}

	.bar-r {
		flex: 1;
	}

	.bar-r-t {
		margin-left: 12rpx;
	}

	.bar-hold {
		height: calc(140rpx + constant(safe-area-inset-bottom));
		height: calc(140rpx + env(safe-area-inset-bottom));
	}
</style>
