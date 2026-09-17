<template>
	<view class="login-page">
		<view class="cover">
			<image class="cover-image" :src="cfg.homeBg" mode="aspectFill" />
			<view class="cover-shade"></view>
			<view class="cover-content" :style="coverStyle">
				<view class="brand-row">
					<view class="brand">
						<image v-if="cfg.brandLogo" class="brand-seal brand-seal-logo" :src="cfg.brandLogo" mode="aspectFill" />
						<view v-else class="brand-seal">{{ cfg.brandMark }}</view>
						<view class="brand-copy">
							<text class="brand-name">{{ cfg.brand }}</text>
							<text class="brand-en">{{ cfg.brandEn }}</text>
						</view>
					</view>
					<view class="skip" @tap="skip">
						<text class="skip-t">先逛逛</text>
						<bl-icon name="chevron-right" :size="24" color="#E5C58A" :weight="2" />
					</view>
				</view>
				<view class="hero-copy">
					<text class="eyebrow">一码兑奖 · 好礼有迹可循</text>
					<text class="hero-title">{{ heroTitle }}</text>
					<text class="hero-sub">{{ heroSub }}</text>
				</view>
			</view>
		</view>

		<view class="surface">
			<view class="assurance">
				<view class="assurance-item">
					<bl-icon name="shield-check" :size="30" color="#4376AB" :weight="2" />
					<text>微信身份验证</text>
				</view>
				<view class="assurance-divider"></view>
				<view class="assurance-item">
					<bl-icon name="history" :size="30" color="#4376AB" :weight="2" />
					<text>兑奖记录可查</text>
				</view>
				<view class="assurance-divider"></view>
				<view class="assurance-item">
					<bl-icon name="store" :size="30" color="#4376AB" :weight="2" />
					<text>门店核销互通</text>
				</view>
			</view>

			<view class="login-copy">
				<text class="login-title">欢迎回来</text>
				<text class="login-sub">无需注册账号，使用微信身份即可安全登录。</text>
			</view>

			<view v-if="errorText" class="error-box">
				<bl-icon name="alert-circle" :size="30" color="#B42318" :weight="2" />
				<text>{{ errorText }}</text>
			</view>

			<checkbox-group class="consent-group" @change="onAgreeChange">
				<label class="consent-row">
					<checkbox class="consent-check" value="agree" :checked="agreed" color="#102E53" />
					<view class="consent-copy">
						<text>我已阅读并同意</text>
						<text class="legal-link" @tap.stop="openLegal('agreement')">《用户服务协议》</text>
						<text>和</text>
						<text class="legal-link" @tap.stop="openLegal('privacy')">《隐私政策》</text>
					</view>
				</label>
			</checkbox-group>

			<button class="wechat-button" :class="{ disabled: loading }" :disabled="loading" @tap="submit">
				<view v-if="loading" class="loading-ring"></view>
				<bl-icon v-else name="message-circle" :size="36" color="#F5F9FD" :weight="2.1" />
				<text>{{ loading ? '正在安全登录…' : '微信快捷登录' }}</text>
			</button>

			<view class="later" @tap="skip">
				<text>暂不登录，继续浏览活动</text>
			</view>

			<view class="privacy-note">
				<bl-icon name="lock" :size="25" color="#60768C" :weight="1.9" />
				<text>微信身份仅用于创建兑奖账户，不会自动获取你的手机号。</text>
			</view>
		</view>
	</view>
</template>

<script>
	// #ifdef MP-WEIXIN
	import { activityShare } from '@/utils/share.mjs'
	// #endif
	import store from '@/store/index.js'
	import { grantCustomerConsent, hasCustomerConsent, revokeCustomerConsent } from '@/utils/api.js'
	import { miniProgramContentTop } from '@/utils/navigation.mjs'

	// 用户是从哪个动作走过来的，标题就说哪件事，避免一句笼统的「请先登录」
	const REASON_COPY = {
		default: {
			title: '登录后，兑奖记录随身带',
			sub: '活动详情、奖品与门店无需登录即可浏览；登录只用于保存你的兑奖记录与领奖凭证。'
		},
		redeem: {
			title: '登录后即可提交兑换码',
			sub: '兑奖需要一个属于你的账户，用来保存中奖结果与到店核销凭证。'
		},
		record: {
			title: '登录后查看我的兑奖记录',
			sub: '中奖奖品、核销状态与有效期，都会保存在你的账户里。'
		},
		coupon: {
			title: '登录后查看我的优惠券',
			sub: '已领取的活动优惠券与到期时间，登录后即可查看。'
		},
		notice: {
			title: '登录后接收服务通知',
			sub: '中奖、核销与到期提醒，都会发到你的账户。'
		},
		profile: {
			title: '登录后管理我的账户',
			sub: '兑奖记录、优惠券与领奖凭证集中在个人中心。'
		}
	}

	export default {
		// #ifdef MP-WEIXIN
		onShareAppMessage() { return activityShare() },
		// #endif
		data() {
			return {
				agreed: false,
				loading: false,
				errorText: '',
				reason: '',
				contentTop: 0
			}
		},
		computed: {
			cfg() { return store.state.config },
			coverStyle() { return this.contentTop ? { paddingTop: this.contentTop + 'px' } : {} },
			heroCopy() {
				return Object.prototype.hasOwnProperty.call(REASON_COPY, this.reason) ? REASON_COPY[this.reason] : REASON_COPY.default
			},
			heroTitle() { return this.heroCopy.title },
			heroSub() { return this.heroCopy.sub }
		},
		onLoad(options) {
			this.agreed = hasCustomerConsent()
			this.reason = (options && options.reason) || ''
			this.updateContentTop()
		},
		onResize() { this.updateContentTop() },
		methods: {
			updateContentTop() {
				// #ifdef MP-WEIXIN
				this.contentTop = miniProgramContentTop(uni)
				// #endif
			},
			// 登录页是用户自己点进来的，必须留一条原路返回的出口，
			// 不能出现「不登录就走不掉」的登录墙。
			skip() {
				const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
				if (pages.length > 1) uni.navigateBack()
				else uni.switchTab({ url: '/pages/index/index' })
			},
			onAgreeChange(event) {
				this.agreed = (event.detail.value || []).includes('agree')
				if (this.agreed) this.errorText = ''
				else revokeCustomerConsent()
			},
			openLegal(type) {
				uni.navigateTo({ url: '/pages/legal/legal?type=' + type })
			},
			friendlyError(error) {
				if (!error) return '暂时无法登录，请稍后重试。'
				if (error.code === 'ERR_NETWORK') return '网络连接失败，请检查网络后重试。'
				if (error.code === 'ERR_OFFLINE') return '当前运行环境不支持微信登录，请在微信小程序中打开。'
				if (error.code === 'ERR_WECHAT_NOT_CONFIGURED') return '登录服务暂未就绪，请稍后重试或联系客服。'
				if (error.code === 'ERR_WECHAT_LOGIN' || error.code === 'ERR_WECHAT_AUTH') return '微信登录未完成，请退出小程序后重新打开并重试。'
				return error.message || '暂时无法登录，请稍后重试。'
			},
			async submit() {
				if (this.loading) return
				if (!this.agreed) {
					this.errorText = '请先阅读并同意用户服务协议和隐私政策。'
					uni.showToast({ title: '请先勾选同意协议', icon: 'none' })
					return
				}
				grantCustomerConsent()
				this.loading = true
				this.errorText = ''
				try {
					await store.loginCustomer()
					uni.showToast({ title: '登录成功', icon: 'none' })
					this.skip()
				} catch (error) {
					this.errorText = this.friendlyError(error)
				} finally {
					this.loading = false
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.login-page {
		min-height: 100vh;
		background: $bl-green-ink;
	}

	.cover {
		min-height: 650rpx;
		position: relative;
		overflow: hidden;
	}

	.cover-image,
	.cover-shade {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.cover-shade {
		background: linear-gradient(180deg, rgba(11, 36, 69, 0.42) 0%, rgba(11, 36, 69, 0.7) 62%, rgba(11, 36, 69, 0.94) 100%);
	}

	.cover-content {
		position: relative;
		z-index: 1;
		min-height: 650rpx;
		padding: calc(42rpx + env(safe-area-inset-top)) 40rpx 96rpx;
		display: flex;
		flex-direction: column;
		gap: 72rpx;
	}

	.brand-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand {
		display: flex;
		align-items: center;
	}

	.skip {
		display: flex;
		align-items: center;
		gap: 2rpx;
		height: 56rpx;
		padding: 0 8rpx 0 20rpx;
		border-radius: 28rpx;
		background: rgba(255, 248, 232, 0.14);
		border: 1rpx solid rgba(240, 215, 154, 0.32);
	}

	.skip-t {
		color: $bl-gold-3;
		font-size: 23rpx;
		font-weight: 650;
		letter-spacing: 1rpx;
	}

	.later {
		margin-top: 22rpx;
		text-align: center;
		color: $bl-ink-2;
		font-size: 25rpx;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 6rpx;
	}

	.brand-seal {
		width: 74rpx;
		height: 74rpx;
		border-radius: 14rpx;
		background: $bl-green;
		border: 1rpx solid rgba(255, 248, 232, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #F5F9FD;
		font-size: 38rpx;
		font-weight: 800;
		box-shadow: 0 10rpx 26rpx rgba(5, 22, 17, 0.26);
	}

	.brand-seal-logo {
		display: block;
		border: 1rpx solid rgba(255, 248, 232, 0.55);
	}

	.brand-copy {
		margin-left: 18rpx;
		display: flex;
		flex-direction: column;
	}

	.brand-name {
		color: #F5F9FD;
		font-size: 32rpx;
		font-weight: 800;
		letter-spacing: 4rpx;
	}

	.brand-en {
		margin-top: 2rpx;
		color: rgba(240, 215, 154, 0.82);
		font-size: 18rpx;
		letter-spacing: 4rpx;
	}

	.hero-copy {
		margin-top: auto;
		display: flex;
		flex-direction: column;
	}

	.eyebrow {
		color: $bl-gold-3;
		font-size: 23rpx;
		font-weight: 650;
		letter-spacing: 3rpx;
	}

	.hero-title {
		margin-top: 18rpx;
		color: #F5F9FD;
		font-size: 50rpx;
		font-weight: 800;
		line-height: 1.24;
		letter-spacing: 1rpx;
	}

	.hero-sub {
		margin-top: 20rpx;
		max-width: 620rpx;
		color: rgba(255, 248, 232, 0.78);
		font-size: 25rpx;
		line-height: 1.7;
	}

	.surface {
		position: relative;
		z-index: 2;
		min-height: calc(100vh - 660rpx);
		margin-top: -40rpx;
		padding: 34rpx 38rpx calc(48rpx + env(safe-area-inset-bottom));
		background: $bl-paper;
		border-radius: 38rpx 38rpx 0 0;
	}

	.assurance {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 2rpx 30rpx;
		border-bottom: 1rpx solid $bl-line;
	}

	.assurance-item {
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 9rpx;
		color: $bl-ink-2;
		font-size: 21rpx;
		white-space: nowrap;
	}

	.assurance-divider {
		width: 1rpx;
		height: 28rpx;
		background: $bl-line;
	}

	.login-copy {
		margin-top: 34rpx;
		display: flex;
		flex-direction: column;
	}

	.login-title {
		color: $bl-ink;
		font-size: 38rpx;
		font-weight: 800;
	}

	.login-sub {
		margin-top: 8rpx;
		color: $bl-ink-2;
		font-size: 25rpx;
	}

	.error-box {
		margin-top: 24rpx;
		padding: 20rpx 22rpx;
		border: 1rpx solid rgba(180, 35, 24, 0.2);
		border-radius: $bl-r-md;
		background: $bl-red-lt;
		display: flex;
		align-items: flex-start;
		gap: 14rpx;
		color: #8F2118;
		font-size: 24rpx;
		line-height: 1.55;
	}

	.consent-group {
		margin-top: 30rpx;
	}

	.consent-row {
		display: flex;
		align-items: flex-start;
	}

	.consent-check {
		margin-top: 1rpx;
		transform: scale(0.82);
		transform-origin: left top;
	}

	.consent-copy {
		flex: 1;
		margin-left: -6rpx;
		color: $bl-ink-3;
		font-size: 23rpx;
		line-height: 1.65;
	}

	.legal-link {
		color: $bl-green;
		font-weight: 650;
	}

	.wechat-button {
		width: 100%;
		height: 96rpx;
		margin-top: 28rpx;
		border-radius: $bl-r-md;
		background: $bl-green;
		color: #F5F9FD;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14rpx;
		font-size: 31rpx;
		font-weight: 750;
		letter-spacing: 1rpx;
		box-shadow: $bl-sd-green;
		transition: transform 180ms ease-out, opacity 180ms ease-out;
	}

	.wechat-button:active {
		transform: scale(0.985);
	}

	.wechat-button.disabled {
		background: #AAB5AE;
		box-shadow: none;
		opacity: 0.72;
	}

	.loading-ring {
		width: 30rpx;
		height: 30rpx;
		border: 3rpx solid rgba(255, 248, 232, 0.32);
		border-top-color: #F5F9FD;
		border-radius: 50%;
		animation: spin 800ms linear infinite;
	}

	.privacy-note {
		margin-top: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		color: $bl-ink-3;
		font-size: 21rpx;
		line-height: 1.5;
		text-align: center;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
