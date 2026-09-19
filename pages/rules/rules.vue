<template>
	<view class="pg bl-paper-tex">
		<view class="hero">
			<image class="hero-bg" :src="cfg.ruleBg" mode="aspectFill" />
			<view class="hero-mask"></view>
			<bl-navbar title="活动规则" bg="transparent" :show-back="false" :fixed="false" />
			<view class="hero-in">
				<view class="hero-seal"><text>规</text></view>
				<text class="hero-t1">{{ cfg.brand }} · {{ cfg.actName }}</text>
				<text class="hero-t2">{{ cfg.actStart }} 至 {{ cfg.actEnd }}</text>
				<view class="hero-st">
					<view class="hero-st-dot" :class="{ off: !cfg.active }"></view>
					<text class="hero-st-t">{{ cfg.active ? '活动进行中' : '活动已暂停' }}</text>
				</view>
			</view>
		</view>

		<view class="bl-wrap">
			<!-- ============ 参与步骤 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">四步参与</text>
					<text class="bl-sec-sub">STEPS</text>
				</view>
			</view>
			<view class="step-g">
				<view v-for="(s, i) in cfg.steps" :key="i" class="step-i bl-card">
					<view class="step-no"><text>0{{ i + 1 }}</text></view>
					<view class="step-ico">
						<bl-icon :name="s.icon" :size="44" color="#102E53" :weight="1.7" />
					</view>
					<text class="step-t">{{ s.t }}</text>
					<text class="step-d">{{ s.d }}</text>
				</view>
			</view>

			<!-- ============ 奖池说明 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">档位与奖池</text>
					<text class="bl-sec-sub">PRIZE POOLS</text>
				</view>
			</view>
			<view class="pool-tip">
				<bl-icon name="layers" :size="28" color="#94692B" :weight="1.8" />
				<text class="pool-tip-t">不同售价档位的兑换码对应各自独立的奖池，奖品不跨池发放，低价产品不会开出高价奖品。</text>
			</view>
			<view v-for="p in pools" :key="p.id" class="pool bl-card">
				<view class="pool-h">
					<view class="pool-h-l">
						<view class="pool-dot" :style="'background:' + p.color"></view>
						<text class="pool-n">{{ p.name }}</text>
					</view>
					<text class="pool-tag" :style="'color:' + p.color + ';border-color:' + p.color + '44'">
						{{ p.tag }}
					</text>
				</view>
				<text class="pool-d">{{ p.desc }}</text>
				<scroll-view class="pool-scroll" scroll-x show-scrollbar="false">
					<view class="pool-row">
						<view v-for="pz in poolPrizes(p.id)" :key="pz.id" class="pool-p">
							<view class="pool-img"><bl-prize-image :src="pz.img" :type="pz.type" /></view>
							<text class="pool-pn bl-ellipsis">{{ pz.name }}</text>
							<text class="pool-pv bl-num">¥{{ pz.value }}</text>
							<view v-if="pz.stock <= 0" class="pool-out"><text>已发完</text></view>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- ============ 核销流程 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">门店核销流程</text>
					<text class="bl-sec-sub">REDEEM</text>
				</view>
			</view>
			<view class="vf bl-card">
				<view v-for="(s, i) in cfg.verifySteps" :key="i" class="vf-i">
					<view class="vf-l">
						<view class="vf-no"><text>{{ i + 1 }}</text></view>
						<view v-if="i < cfg.verifySteps.length - 1" class="vf-line"></view>
					</view>
					<text class="vf-t">{{ s }}</text>
				</view>
			</view>

			<!-- ============ 条款 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">活动细则</text>
					<text class="bl-sec-sub">TERMS</text>
				</view>
			</view>
			<view class="terms bl-card">
				<view v-for="(t, i) in cfg.terms" :key="i" class="term" @tap="toggle(i)">
					<view class="term-h">
						<text class="term-t">{{ t.t }}</text>
						<bl-icon :name="open === i ? 'chevron-up' : 'chevron-down'" :size="28"
							color="#60768C" :weight="2" />
					</view>
					<view v-if="open === i" class="term-b">
						<text class="term-d">{{ t.d }}</text>
					</view>
					<view v-if="i < cfg.terms.length - 1" class="bl-hr"></view>
				</view>
			</view>

			<!-- ============ 客服 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">客服支持</text>
					<text class="bl-sec-sub">SUPPORT</text>
				</view>
			</view>
			<view class="svc bl-card">
				<view v-if="cfg.service.phone" class="svc-i" @tap="call">
					<view class="svc-ico" style="background:#E6EFF8">
						<bl-icon name="phone" :size="36" color="#4376AB" :weight="1.8" />
					</view>
					<view class="svc-txt">
						<text class="svc-t">客服热线</text>
						<text class="svc-d">{{ cfg.service.phone }} · {{ cfg.service.time }}</text>
					</view>
					<bl-icon name="chevron-right" :size="26" color="#9AAEBF" :weight="2" />
				</view>
				<view v-if="cfg.service.phone && cfg.service.wechat" class="bl-hr"></view>
				<view v-if="cfg.service.wechat" class="svc-i" @tap="copyWx">
					<view class="svc-ico" style="background:#F6EEDC">
						<bl-icon name="message-circle" :size="36" color="#94692B" :weight="1.8" />
					</view>
					<view class="svc-txt">
						<text class="svc-t">在线客服微信</text>
						<text class="svc-d">{{ cfg.service.wechat }}（点击复制）</text>
					</view>
					<bl-icon name="copy" :size="26" color="#9AAEBF" :weight="2" />
				</view>
			</view>

			<view class="note">
				<text class="note-t">{{ cfg.service.note }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	// #ifdef MP-WEIXIN
	import { activityShare } from '@/utils/share.mjs'
	// #endif
	import store from '@/store/index.js'

	export default {
		// #ifdef MP-WEIXIN
		onShareAppMessage() { return activityShare() },
		// #endif
		data() {
			return { open: 0 }
		},
		computed: {
			cfg() { return store.state.config },
			pools() { return store.POOLS.filter(p => p.presentation?.visible !== false) }
		},
		methods: {
			poolPrizes(id) {
				return store.state.prizes.filter(p => p.pool === id && p.on)
			},
			toggle(i) {
				this.open = this.open === i ? -1 : i
			},
			call() {
				uni.makePhoneCall({ phoneNumber: this.cfg.service.phone, fail: () => {} })
			},
			copyWx() {
				uni.setClipboardData({
					data: this.cfg.service.wechat,
					success: () => uni.showToast({ title: '客服微信已复制', icon: 'none' })
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		padding-bottom: 60rpx;
	}

	/* ============ Hero ============ */
	.hero {
		position: relative;
		padding-bottom: 46rpx;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.hero-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(175deg, rgba(9, 31, 59, 0.88), rgba(16, 46, 83, 0.92));
	}

	.hero-in {
		position: relative;
		z-index: 2;
		padding: 10rpx $bl-pad 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.hero-seal {
		width: 78rpx;
		height: 78rpx;
		border-radius: 12rpx;
		background: linear-gradient(140deg, #D6B16D, #A97834);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.28);

		text {
			color: #F5F9FD;
			font-size: 40rpx;
			font-weight: 800;
		}
	}

	.hero-t1 {
		margin-top: 22rpx;
		font-size: 40rpx;
		font-weight: 800;
		color: #F5F9FD;
		letter-spacing: 3rpx;
	}

	.hero-t2 {
		margin-top: 10rpx;
		font-size: 23rpx;
		color: rgba(240, 215, 154, 0.78);
		letter-spacing: 1rpx;
	}

	.hero-st {
		margin-top: 20rpx;
		height: 48rpx;
		padding: 0 22rpx;
		border-radius: $bl-r-pill;
		background: rgba(255, 255, 255, 0.12);
		border: 1rpx solid rgba(240, 215, 154, 0.24);
		display: flex;
		align-items: center;
	}

	.hero-st-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: #6ED39B;
		margin-right: 10rpx;
		box-shadow: 0 0 0 6rpx rgba(110, 211, 155, 0.18);

		&.off {
			background: #9AAEBF;
			box-shadow: none;
		}
	}

	.hero-st-t {
		font-size: 22rpx;
		color: #F5F9FD;
	}

	/* ============ 步骤 ============ */
	.step-g {
		display: flex;
		flex-wrap: wrap;
	}

	.step-i {
		width: 48.5%;
		margin-right: 3%;
		margin-bottom: 20rpx;
		padding: 26rpx 22rpx;
		position: relative;

		&:nth-child(2n) {
			margin-right: 0;
		}
	}

	.step-no {
		position: absolute;
		right: 20rpx;
		top: 16rpx;

		text {
			font-size: 34rpx;
			font-weight: 800;
			color: rgba(184, 137, 43, 0.18);
			letter-spacing: 1rpx;
		}
	}

	.step-ico {
		width: 76rpx;
		height: 76rpx;
		border-radius: $bl-r-md;
		background: $bl-green-lt;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.step-t {
		display: block;
		margin-top: 18rpx;
		font-size: 28rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.step-d {
		display: block;
		margin-top: 6rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
		line-height: 1.6;
	}

	/* ============ 奖池 ============ */
	.pool-tip {
		display: flex;
		align-items: flex-start;
		padding: 18rpx 20rpx;
		background: $bl-gold-lt;
		border: 1rpx solid rgba(184, 137, 43, 0.22);
		border-radius: $bl-r-md;
		margin-bottom: 20rpx;
	}

	.pool-tip-t {
		flex: 1;
		margin-left: 12rpx;
		font-size: 22rpx;
		color: #8A6520;
		line-height: 1.6;
	}

	.pool {
		padding: 26rpx;
		margin-bottom: 20rpx;
	}

	.pool-h {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.pool-h-l {
		display: flex;
		align-items: center;
	}

	.pool-dot {
		width: 14rpx;
		height: 14rpx;
		border-radius: 4rpx;
		margin-right: 12rpx;
	}

	.pool-n {
		font-size: 30rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.pool-tag {
		font-size: 20rpx;
		padding: 4rpx 14rpx;
		border-radius: 6rpx;
		border: 1rpx solid;
	}

	.pool-d {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: $bl-ink-3;
		line-height: 1.6;
	}

	.pool-scroll {
		margin-top: 20rpx;
		width: 100%;
		white-space: nowrap;
	}

	.pool-row {
		display: flex;
	}

	.pool-p {
		width: 150rpx;
		margin-right: 18rpx;
		flex-shrink: 0;
		position: relative;
	}

	.pool-img {
		width: 150rpx;
		height: 150rpx;
		border-radius: $bl-r-sm;
		background: #F2F1EC;
	}

	.pool-pn {
		display: block;
		margin-top: 10rpx;
		font-size: 22rpx;
		color: $bl-ink;
	}

	.pool-pv {
		display: block;
		font-size: 22rpx;
		color: $bl-red;
	}

	.pool-out {
		position: absolute;
		left: 0;
		top: 0;
		width: 150rpx;
		height: 150rpx;
		border-radius: $bl-r-sm;
		background: rgba(23, 45, 69, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;

		text {
			color: #fff;
			font-size: 22rpx;
			font-weight: 700;
		}
	}

	/* ============ 核销流程 ============ */
	.vf {
		padding: 28rpx 26rpx 8rpx;
	}

	.vf-i {
		display: flex;
	}

	.vf-l {
		width: 44rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.vf-no {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background: $bl-green;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		text {
			color: #F5F9FD;
			font-size: 22rpx;
			font-weight: 700;
		}
	}

	.vf-line {
		flex: 1;
		width: 2rpx;
		background: rgba(16, 46, 83, 0.14);
		margin: 6rpx 0;
	}

	.vf-t {
		flex: 1;
		margin-left: 20rpx;
		padding-bottom: 26rpx;
		font-size: 25rpx;
		color: $bl-ink-2;
		line-height: 1.6;
	}

	/* ============ 条款 ============ */
	.terms {
		padding: 6rpx 26rpx;
	}

	.term-h {
		height: 96rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.term-t {
		font-size: 28rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.term-b {
		padding-bottom: 22rpx;
	}

	.term-d {
		font-size: 24rpx;
		color: $bl-ink-2;
		line-height: 1.8;
	}

	/* ============ 客服 ============ */
	.svc {
		padding: 0 26rpx;
	}

	.svc-i {
		height: 130rpx;
		display: flex;
		align-items: center;
	}

	.svc-ico {
		width: 76rpx;
		height: 76rpx;
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.svc-txt {
		flex: 1;
		margin-left: 20rpx;
	}

	.svc-t {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.svc-d {
		display: block;
		margin-top: 4rpx;
		font-size: 22rpx;
		color: $bl-ink-3;
	}

	.note {
		margin-top: 34rpx;
		padding: 0 20rpx;
	}

	.note-t {
		font-size: 21rpx;
		color: $bl-ink-4;
		line-height: 1.7;
	}
</style>
