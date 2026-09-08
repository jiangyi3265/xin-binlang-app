<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="输码核销" bg="paper" home="/pagesStore/home/home" />

		<view class="bl-wrap">
			<view class="card bl-card">
				<view class="card-h">
					<view class="card-ico">
						<bl-icon name="keyboard" :size="44" color="#0E3B2E" :weight="1.7" />
					</view>
					<view class="card-txt">
						<text class="card-t">手动输入核销码</text>
						<text class="card-d">新兑换码为 6 位纯数字，历史码仍可输入</text>
					</view>
				</view>

				<view class="code" @tap="focus = true">
					<view v-for="i in 6" :key="i" class="cell"
						:class="{ 'is-on': code.length === i - 1 && focus, 'is-fill': code.length >= i }">
						<text class="cell-t">{{ code[i - 1] || '' }}</text>
					</view>
					<input class="hide-in" type="text" :focus="focus" :value="code" maxlength="6"
						:adjust-position="false" confirm-type="done" @input="onInput" @focus="focus = true"
						@blur="focus = false" @confirm="submit" />
				</view>

				<view v-if="err" class="err">
					<bl-icon name="alert-circle" :size="26" color="#C0392B" :weight="1.9" />
					<text class="err-t">{{ err }}</text>
				</view>

				<view class="btn bl-btn" :class="code.length === 6 ? 'bl-btn-primary' : 'bl-btn-disabled'"
					@tap="submit">
					<text>查询订单</text>
				</view>

				<view class="or">
					<view class="or-l"></view>
					<text class="or-t">或</text>
					<view class="or-l"></view>
				</view>

				<view class="scan bl-btn bl-btn-ghost" @tap="toScan">
					<bl-icon name="scan-qr" :size="34" color="#0E3B2E" :weight="1.9" />
					<text class="scan-t">切换扫码核销</text>
				</view>
			</view>

			<!-- 最近核销 -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">最近核销</text>
				</view>
				<view v-if="canView" class="bl-sec-more" @tap="goLogs">
					<text>全部日志</text>
					<bl-icon name="chevron-right" :size="24" color="#8B9A92" :weight="2" />
				</view>
			</view>

			<bl-empty v-if="!recent.length" icon="history" text="今日还没有核销记录" />

			<view v-for="l in recent" :key="l.id" class="lg bl-card">
				<view class="lg-ico" :class="l.type === 'verify' ? 'ok' : 'no'">
					<bl-icon :name="l.type === 'verify' ? 'check-circle' : 'ban'" :size="32"
						:color="l.type === 'verify' ? '#2C7256' : '#C0392B'" :weight="1.8" />
				</view>
				<view class="lg-txt">
					<view class="lg-r1">
						<text class="lg-code bl-num">{{ l.code }}</text>
						<text class="lg-time">{{ rel(l.at) }}</text>
					</view>
					<text class="lg-p">{{ l.prizeName }} · {{ l.userNick }}</text>
					<text class="lg-r">{{ l.result }} · 操作人 {{ l.byName }}</text>
				</view>
			</view>
		</view>

		<bl-storebar active="scan" />
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { rel } from '@/utils/date.js'

	export default {
		data() {
			return { code: '', focus: false, err: '' }
		},
		computed: {
			canView() { return store.canViewData() },
			recent() { return store.storeLogs().slice(0, 5) }
		},
		onLoad() {
			setTimeout(() => { this.focus = true }, 400)
		},
		onShow() {
			if (!store.account()) uni.redirectTo({ url: '/pagesStore/login/login' })
		},
		methods: {
			rel,
			onInput(e) {
				const v = (e.detail.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
				this.code = v
				this.err = ''
				return v
			},
			async submit() {
				if (this.code.length !== 6) {
					this.err = '请输入完整的 6 位核销码'
					return
				}
				const res = await store.findForVerify(this.code)
				if (!res.ok && res.code === 'ERR_NOT_FOUND') {
					this.err = res.msg
					return
				}
				this.focus = false
				uni.navigateTo({ url: '/pagesStore/confirm/confirm?code=' + this.code })
			},
			toScan() {
				uni.redirectTo({ url: '/pagesStore/scan/scan' })
			},
			goLogs() {
				uni.navigateTo({ url: '/pagesStore/logs/logs' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
	}

	.card {
		margin-top: 16rpx;
		padding: 30rpx 28rpx;
	}

	.card-h {
		display: flex;
		align-items: center;
	}

	.card-ico {
		width: 88rpx;
		height: 88rpx;
		border-radius: $bl-r-md;
		background: $bl-green-lt;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-txt {
		flex: 1;
		margin-left: 20rpx;
	}

	.card-t {
		display: block;
		font-size: 32rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.card-d {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: $bl-ink-3;
	}

	.code {
		position: relative;
		margin-top: 32rpx;
		display: flex;
		justify-content: space-between;
	}

	.cell {
		width: 88rpx;
		height: 104rpx;
		border-radius: $bl-r-md;
		background: #F7F5EE;
		border: 2rpx solid $bl-line;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cell.is-fill {
		background: #fff;
		border-color: rgba(14, 59, 46, 0.5);
	}

	.cell.is-on {
		border-color: $bl-gold;
		background: $bl-gold-lt;
	}

	.cell-t {
		font-size: 46rpx;
		font-weight: 800;
		color: $bl-green;
	}

	.hide-in {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 104rpx;
		opacity: 0;
	}

	.err {
		margin-top: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.err-t {
		margin-left: 8rpx;
		font-size: 24rpx;
		color: $bl-red;
	}

	.btn {
		margin-top: 30rpx;
	}

	.or {
		margin: 26rpx 0;
		display: flex;
		align-items: center;
	}

	.or-l {
		flex: 1;
		height: 1rpx;
		background: $bl-line;
	}

	.or-t {
		margin: 0 20rpx;
		font-size: 22rpx;
		color: $bl-ink-4;
	}

	.scan-t {
		margin-left: 12rpx;
	}

	/* 日志 */
	.lg {
		margin-top: 18rpx;
		padding: 20rpx;
		display: flex;
	}

	.lg-ico {
		width: 64rpx;
		height: 64rpx;
		border-radius: $bl-r-sm;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&.ok {
			background: $bl-green-lt;
		}

		&.no {
			background: $bl-red-lt;
		}
	}

	.lg-txt {
		flex: 1;
		margin-left: 18rpx;
		min-width: 0;
	}

	.lg-r1 {
		display: flex;
		align-items: baseline;
	}

	.lg-code {
		flex: 1;
		font-size: 28rpx;
		color: $bl-ink;
		letter-spacing: 2rpx;
	}

	.lg-time {
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	.lg-p {
		display: block;
		margin-top: 4rpx;
		font-size: 22rpx;
		color: $bl-ink-2;
	}

	.lg-r {
		display: block;
		margin-top: 2rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
	}
</style>
