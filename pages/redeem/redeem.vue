<template>
	<view class="pg">
		<!-- 顶部墨绿区 -->
		<view class="top">
			<image class="top-bg" :src="cfg.poster" mode="aspectFill" />
			<view class="top-mask"></view>
			<bl-navbar title="输码兑奖" bg="transparent" :fixed="false" />
			<view class="top-in">
				<view class="top-t1">输入包装内 6 位数字兑换码</view>
				<view class="top-t2">新兑换码为纯数字，历史字母数字码仍可使用</view>
			</view>
		</view>

		<view class="bl-wrap">
			<!-- ============ 输入卡 ============ -->
			<view class="card">
				<image class="card-prod" :src="cfg.productImg" mode="aspectFit" />

				<view class="code" @tap="focusInput">
					<view v-for="i in 6" :key="i" class="cell"
						:class="{ 'is-on': code.length === i - 1 && focus, 'is-fill': code.length >= i }">
						<text class="cell-t">{{ code[i - 1] || '' }}</text>
						<view v-if="code.length === i - 1 && focus" class="caret"></view>
					</view>
					<input class="hide-in" type="text" :focus="focus" :value="code" maxlength="6"
						:adjust-position="false" confirm-type="done" @input="onInput" @focus="focus = true"
						@blur="focus = false" @confirm="submit" />
				</view>

				<view v-if="tip" class="tip">
					<bl-icon name="alert-circle" :size="26" color="#C0392B" :weight="1.9" />
					<text class="tip-t">{{ tip }}</text>
				</view>

				<view class="btn bl-btn" :class="canSubmit ? 'bl-btn-primary' : 'bl-btn-disabled'" @tap="submit">
					<text v-if="!loading">立即开奖</text>
					<text v-else>开奖中…</text>
				</view>

				<view class="limit">
					<view class="limit-l">
						<bl-icon name="shield-check" :size="26" color="#2C7256" :weight="1.8" />
						<text v-if="!logged" class="limit-t">开奖前会请你完成微信登录</text>
						<text v-else-if="unlimited" class="limit-t">今日兑奖不限次数</text>
						<text v-else class="limit-t">今日剩余 <text class="limit-n">{{ left }}</text> / {{ cfg.dailyLimit }} 次</text>
					</view>
					<view class="limit-r" @tap="goRecord">
						<text>兑奖记录</text>
						<bl-icon name="chevron-right" :size="22" color="#8B9A92" :weight="2" />
					</view>
				</view>
			</view>

			<!-- ============ 规则要点 ============ -->
			<view class="rule">
				<view v-for="(r, i) in rules" :key="i" class="rule-i">
					<bl-icon :name="r.icon" :size="30" color="#B8892B" :weight="1.8" />
					<text class="rule-t">{{ r.t }}</text>
				</view>
			</view>

		</view>

		<!-- ============ 中奖弹窗 ============ -->
		<bl-popup v-model:show="showWin" type="center" :mask-close="false">
			<view class="rw">
				<view class="rw-glow"></view>
				<view class="rw-top">
					<view class="rw-badge"><text>恭 喜 中 奖</text></view>
					<text class="rw-lv">{{ result.record && result.record.prizeLevel }}</text>
				</view>
				<view class="rw-img-box">
					<image class="rw-img" :src="result.record && result.record.prizeImg" mode="aspectFill" />
				</view>
				<text class="rw-n">{{ result.record && result.record.prizeName }}</text>
				<text class="rw-spec">{{ result.record && result.record.prizeSpec }}</text>
				<view class="rw-v">
					<text class="rw-v1">奖品价值</text>
					<text class="rw-v2 bl-num">¥{{ result.record && result.record.prizeValue }}</text>
				</view>
				<view class="rw-info">
					<view class="rw-info-i">
						<text class="rw-info-k">兑换码</text>
						<text class="rw-info-v bl-num">{{ result.record && result.record.code }}</text>
					</view>
					<view class="rw-info-x"></view>
					<view class="rw-info-i">
						<text class="rw-info-k">核销有效期</text>
						<text class="rw-info-v">{{ cfg.prizeValidDays }} 天内</text>
					</view>
				</view>
				<view class="rw-btns">
					<view class="rw-b1 bl-btn bl-btn-line" @tap="again">
						<text>继续兑奖</text>
					</view>
					<view class="rw-b2 bl-btn bl-btn-gold" @tap="toDetail">
						<text>查看领奖凭证</text>
					</view>
				</view>
			</view>
		</bl-popup>

		<!-- ============ 未中奖弹窗 ============ -->
		<bl-popup v-model:show="showLose" type="center" :mask-close="false">
			<view class="rl">
				<view class="rl-ico">
					<bl-icon name="leaf" :size="72" color="#9BB0A5" :weight="1.5" />
				</view>
				<text class="rl-t">很遗憾，本次未中奖</text>
				<text class="rl-d">感谢参与，平台已为你发放一张补偿券</text>
				<view class="rl-cp">
					<view class="rl-cp-l">
						<text class="rl-cp-a bl-num">¥3</text>
						<text class="rl-cp-f">满 20 可用</text>
					</view>
					<view class="rl-cp-dash"></view>
					<view class="rl-cp-r">
						<text class="rl-cp-n">未中奖补偿券</text>
						<text class="rl-cp-s">30 天内有效 · 合作门店通用</text>
					</view>
				</view>
				<view class="rl-btns">
					<view class="rl-b1 bl-btn bl-btn-line" @tap="toCoupon">
						<text>查看券包</text>
					</view>
					<view class="rl-b2 bl-btn bl-btn-primary" @tap="again">
						<text>再来一次</text>
					</view>
				</view>
			</view>
		</bl-popup>

		<!-- ============ 拦截弹窗 ============ -->
		<bl-popup v-model:show="showErr" type="center">
			<view class="re">
				<view class="re-ico">
					<bl-icon :name="errIcon" :size="60" color="#C0392B" :weight="1.7" />
				</view>
				<text class="re-t">{{ errTitle }}</text>
				<text class="re-d">{{ result.msg }}</text>
				<view class="re-btn bl-btn bl-btn-primary" @tap="showErr = false">
					<text>我知道了</text>
				</view>
			</view>
		</bl-popup>
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { requireCustomerLogin } from '@/utils/api.js'

	const ERR_TITLE = {
		ERR_FORMAT: '兑换码格式有误',
		ERR_CLOSED: '活动已暂停',
		ERR_BLOCKED: '账号受限',
		ERR_LIMIT: '今日次数已用完',
		ERR_INVALID: '兑换码不存在',
		ERR_USED: '该码已被使用',
		ERR_BATCH_EXPIRED: '卡密批次已过期'
	}
	const ERR_ICON = {
		ERR_FORMAT: 'alert-circle',
		ERR_CLOSED: 'ban',
		ERR_BLOCKED: 'user-x',
		ERR_LIMIT: 'hourglass',
		ERR_INVALID: 'x-circle',
		ERR_USED: 'history',
		ERR_BATCH_EXPIRED: 'timer'
	}

	export default {
		data() {
			return {
				code: '',
				focus: false,
				loading: false,
				resumeAfterLogin: false,
				tip: '',
				result: {},
				showWin: false,
				showLose: false,
				showErr: false,
				rules: [
					{ icon: 'ticket', t: '一码一兑，重复无效' },
					{ icon: 'layers', t: '按档位对应独立奖池' },
					{ icon: 'timer', t: '中奖后 30 天内核销' }
				]
			}
		},
		computed: {
			cfg() { return store.state.config },
			logged() { return store.isCustomerAuthenticated() },
			unlimited() { return Number(this.cfg.dailyLimit || 0) <= 0 },
			left() { return store.todayLeft() },
			canSubmit() { return this.code.length === 6 && !this.loading },
			errTitle() { return ERR_TITLE[this.result.code] || '无法兑奖' },
			errIcon() { return ERR_ICON[this.result.code] || 'alert-circle' }
		},
		onLoad(opt) {
			if (opt && opt.code) this.code = String(opt.code).toUpperCase().slice(0, 6)
			setTimeout(() => { this.focus = true }, 400)
		},
		onShow() {
			// 未登录也能进来看规则、输码。只有真的点了开奖才去登录，
			// 登录完成返回本页时，把用户刚才那一次动作接着做完。
			if (!this.resumeAfterLogin) return
			this.resumeAfterLogin = false
			if (store.isCustomerAuthenticated()) this.submit()
		},
		methods: {
			focusInput() {
				this.focus = true
			},
			onInput(e) {
				const v = (e.detail.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
				this.code = v
				this.tip = ''
				return v
			},
			goRecord() {
				uni.switchTab({ url: '/pages/record/record' })
			},
			async submit() {
				if (this.loading) return
				if (this.code.length !== 6) {
					this.tip = '请输入完整的 6 位兑换码'
					return
				}
				if (!store.isCustomerAuthenticated()) {
					this.focus = false
					this.resumeAfterLogin = true
					requireCustomerLogin({ reason: 'redeem' })
					return
				}
				this.loading = true
				this.focus = false
				store.requestNotifications().catch(() => {})
				const res = await store.redeem(this.code)
				this.loading = false
				this.result = res
				if (res.code === 'ERR_AUTH_REQUIRED' || res.code === 'ERR_AUTH') {
					this.tip = '登录状态已失效，请重新登录后再兑奖'
					this.resumeAfterLogin = true
					requireCustomerLogin({ reason: 'redeem' })
				} else if (res.ok && res.code === 'OK_WIN') {
					this.showWin = true
					uni.vibrateShort && uni.vibrateShort({})
				} else if (res.ok) {
					this.showLose = true
				} else {
					this.showErr = true
					this.tip = res.msg
				}
			},
			again() {
				this.showWin = false
				this.showLose = false
				this.code = ''
				this.tip = ''
				setTimeout(() => { this.focus = true }, 300)
			},
			toDetail() {
				const id = this.result.record.id
				this.showWin = false
				uni.navigateTo({ url: '/pages/record/detail?id=' + id })
			},
			toCoupon() {
				this.showLose = false
				uni.navigateTo({ url: '/pages/coupon/coupon' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		background: $bl-paper;
		padding-bottom: 60rpx;
	}

	/* ============ 顶部 ============ */
	.top {
		position: relative;
		padding-bottom: 130rpx;
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
		background: linear-gradient(175deg, rgba(10, 43, 33, 0.9) 0%, rgba(14, 59, 46, 0.82) 100%);
	}

	.top-in {
		position: relative;
		z-index: 2;
		padding: 20rpx $bl-pad 0;
	}

	.top-t1 {
		font-size: 44rpx;
		font-weight: 800;
		color: #FFF6E6;
		letter-spacing: 2rpx;
	}

	.top-t2 {
		margin-top: 10rpx;
		font-size: 24rpx;
		color: rgba(240, 215, 154, 0.78);
	}

	/* ============ 输入卡 ============ */
	.card {
		margin-top: -100rpx;
		position: relative;
		z-index: 5;
		background: $bl-card;
		border-radius: $bl-r-xl;
		padding: 0 30rpx 30rpx;
		box-shadow: 0 20rpx 48rpx rgba(14, 59, 46, 0.14);
		border: 1rpx solid rgba(240, 215, 154, 0.5);
	}

	.card-prod {
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		margin: -70rpx auto 0;
		border: 6rpx solid #fff;
		box-shadow: 0 10rpx 30rpx rgba(14, 59, 46, 0.18);
		background: #F4F2EC;
	}

	.code {
		position: relative;
		margin-top: 34rpx;
		display: flex;
		justify-content: space-between;
	}

	.cell {
		width: 92rpx;
		height: 108rpx;
		border-radius: $bl-r-md;
		background: #F7F5EE;
		border: 2rpx solid $bl-line;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		transition: all 0.16s ease;
	}

	.cell.is-fill {
		background: #fff;
		border-color: rgba(14, 59, 46, 0.5);
	}

	.cell.is-on {
		border-color: $bl-gold;
		background: $bl-gold-lt;
		box-shadow: 0 0 0 6rpx rgba(184, 137, 43, 0.1);
	}

	.cell-t {
		font-size: 48rpx;
		font-weight: 800;
		color: $bl-green;
		letter-spacing: 2rpx;
	}

	.caret {
		position: absolute;
		width: 4rpx;
		height: 46rpx;
		background: $bl-gold;
		border-radius: 2rpx;
		animation: blink 1s steps(1) infinite;
	}

	@keyframes blink {
		0%, 49% { opacity: 1; }
		50%, 100% { opacity: 0; }
	}

	.hide-in {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 108rpx;
		opacity: 0;
	}

	.tip {
		margin-top: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tip-t {
		margin-left: 8rpx;
		font-size: 24rpx;
		color: $bl-red;
	}

	.btn {
		margin-top: 34rpx;
	}

	.limit {
		margin-top: 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 22rpx;
		border-top: 1rpx dashed $bl-line;
	}

	.limit-l {
		display: flex;
		align-items: center;
	}

	.limit-t {
		margin-left: 8rpx;
		font-size: 24rpx;
		color: $bl-ink-2;
	}

	.limit-n {
		color: $bl-red;
		font-weight: 800;
	}

	.limit-r {
		display: flex;
		align-items: center;
		font-size: 24rpx;
		color: $bl-ink-3;
	}

	/* ============ 规则要点 ============ */
	.rule {
		margin-top: 28rpx;
		display: flex;
		justify-content: space-between;
	}

	.rule-i {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 22rpx 8rpx;
		background: rgba(255, 255, 255, 0.7);
		border: 1rpx solid rgba(230, 225, 212, 0.8);
		border-radius: $bl-r-md;
		margin-right: 16rpx;

		&:last-child {
			margin-right: 0;
		}
	}

	.rule-t {
		margin-top: 10rpx;
		font-size: 21rpx;
		color: $bl-ink-2;
		text-align: center;
	}

	/* ============ 中奖弹窗 ============ */
	.rw {
		width: 620rpx;
		background: linear-gradient(180deg, #FFFDF7 0%, #FFF7E6 100%);
		border-radius: $bl-r-xl;
		padding: 36rpx 36rpx 32rpx;
		position: relative;
		overflow: hidden;
		border: 2rpx solid rgba(184, 137, 43, 0.35);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.rw-glow {
		position: absolute;
		left: 50%;
		top: -180rpx;
		width: 620rpx;
		height: 400rpx;
		margin-left: -310rpx;
		background: radial-gradient(closest-side, rgba(217, 169, 74, 0.35), rgba(217, 169, 74, 0));
	}

	.rw-top {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.rw-badge {
		height: 52rpx;
		padding: 0 30rpx;
		border-radius: $bl-r-pill;
		background: linear-gradient(135deg, #F3D689, #B8892B);
		display: flex;
		align-items: center;

		text {
			color: #43300A;
			font-size: 26rpx;
			font-weight: 800;
			letter-spacing: 4rpx;
		}
	}

	.rw-lv {
		margin-top: 14rpx;
		font-size: 22rpx;
		color: $bl-gold;
		letter-spacing: 3rpx;
	}

	.rw-img-box {
		position: relative;
		z-index: 2;
		margin-top: 20rpx;
		width: 300rpx;
		height: 300rpx;
		border-radius: $bl-r-lg;
		overflow: hidden;
		border: 4rpx solid #fff;
		box-shadow: 0 14rpx 36rpx rgba(184, 137, 43, 0.28);
	}

	.rw-img {
		width: 100%;
		height: 100%;
	}

	.rw-n {
		position: relative;
		z-index: 2;
		margin-top: 24rpx;
		font-size: 40rpx;
		font-weight: 800;
		color: $bl-ink;
		letter-spacing: 1rpx;
	}

	.rw-spec {
		position: relative;
		z-index: 2;
		margin-top: 6rpx;
		font-size: 23rpx;
		color: $bl-ink-3;
	}

	.rw-v {
		position: relative;
		z-index: 2;
		margin-top: 14rpx;
		display: flex;
		align-items: baseline;
	}

	.rw-v1 {
		font-size: 22rpx;
		color: $bl-ink-4;
		margin-right: 8rpx;
	}

	.rw-v2 {
		font-size: 40rpx;
		color: $bl-red;
	}

	.rw-info {
		position: relative;
		z-index: 2;
		margin-top: 26rpx;
		width: 100%;
		background: rgba(255, 255, 255, 0.86);
		border: 1rpx solid rgba(184, 137, 43, 0.22);
		border-radius: $bl-r-md;
		padding: 20rpx 0;
		display: flex;
		align-items: center;
	}

	.rw-info-i {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.rw-info-k {
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	.rw-info-v {
		margin-top: 6rpx;
		font-size: 28rpx;
		color: $bl-ink;
		font-weight: 700;
		letter-spacing: 2rpx;
	}

	.rw-info-x {
		width: 1rpx;
		height: 44rpx;
		background: rgba(184, 137, 43, 0.2);
	}

	.rw-btns {
		position: relative;
		z-index: 2;
		margin-top: 28rpx;
		width: 100%;
		display: flex;
	}

	.rw-b1 {
		width: 210rpx;
		margin-right: 20rpx;
	}

	.rw-b2 {
		flex: 1;
	}

	/* ============ 未中奖弹窗 ============ */
	.rl {
		width: 600rpx;
		background: $bl-card;
		border-radius: $bl-r-xl;
		padding: 44rpx 36rpx 32rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.rl-ico {
		width: 132rpx;
		height: 132rpx;
		border-radius: 50%;
		background: $bl-green-lt;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.rl-t {
		margin-top: 24rpx;
		font-size: 36rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.rl-d {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: $bl-ink-3;
	}

	.rl-cp {
		margin-top: 28rpx;
		width: 100%;
		height: 150rpx;
		background: linear-gradient(120deg, #FFF7E6, #FBF1DA);
		border: 1rpx solid rgba(184, 137, 43, 0.3);
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		overflow: hidden;
	}

	.rl-cp-l {
		width: 200rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.rl-cp-a {
		font-size: 56rpx;
		color: $bl-red;
	}

	.rl-cp-f {
		font-size: 20rpx;
		color: #A07A2A;
	}

	.rl-cp-dash {
		width: 1rpx;
		height: 100rpx;
		border-left: 2rpx dashed rgba(184, 137, 43, 0.45);
	}

	.rl-cp-r {
		flex: 1;
		padding-left: 26rpx;
	}

	.rl-cp-n {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: #6B4E12;
	}

	.rl-cp-s {
		display: block;
		margin-top: 6rpx;
		font-size: 21rpx;
		color: #A07A2A;
	}

	.rl-btns {
		margin-top: 32rpx;
		width: 100%;
		display: flex;
	}

	.rl-b1 {
		width: 210rpx;
		margin-right: 20rpx;
	}

	.rl-b2 {
		flex: 1;
	}

	/* ============ 错误弹窗 ============ */
	.re {
		width: 560rpx;
		background: $bl-card;
		border-radius: $bl-r-xl;
		padding: 44rpx 36rpx 32rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.re-ico {
		width: 118rpx;
		height: 118rpx;
		border-radius: 50%;
		background: $bl-red-lt;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.re-t {
		margin-top: 24rpx;
		font-size: 34rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.re-d {
		margin-top: 12rpx;
		font-size: 24rpx;
		color: $bl-ink-2;
		text-align: center;
		line-height: 1.7;
	}

	.re-btn {
		margin-top: 32rpx;
		width: 100%;
	}
</style>
