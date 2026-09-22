<template>
	<view class="legal-page bl-paper-tex">
		<bl-navbar :title="title" bg="paper" home="/pages/auth/login" />
		<view class="legal-wrap">
			<view class="legal-head">
				<text class="legal-title">{{ title }}</text>
				<text class="legal-intro">{{ intro }}</text>
				<text class="legal-date">更新日期：2026年8月13日</text>
			</view>

			<view class="legal-body">
				<view v-for="(section, index) in sections" :key="section.title" class="legal-section">
					<view class="section-heading">
						<text class="section-index">{{ String(index + 1).padStart(2, '0') }}</text>
						<text class="section-title">{{ section.title }}</text>
					</view>
					<text v-if="section.text" class="section-text">{{ section.text }}</text>
					<view v-for="item in section.items || []" :key="item" class="section-item">
						<view class="item-dot"></view>
						<text>{{ item }}</text>
					</view>
				</view>
			</view>

			<view class="legal-foot">
				<bl-icon name="shield-check" :size="30" color="#4376AB" :weight="2" />
				<text>我们会持续按照最小必要原则保护你的账户与兑奖数据。</text>
			</view>
		</view>
	</view>
</template>

<script>
	// #ifdef MP-WEIXIN
	import { activityShare } from '@/utils/share.mjs'
	// #endif
	const DOCUMENTS = {
		agreement: {
			title: '用户服务协议',
			intro: '本协议用于说明你使用倌榔一码兑奖服务时的权利、责任与基本规则。',
			sections: [
				{ title: '服务内容', text: '平台为消费者提供兑换码验证、抽奖结果展示、兑奖记录、奖品状态、意向门店选择和到店核销等服务。具体活动以页面公示规则为准。' },
				{ title: '账户与登录', text: '你可以使用微信身份快捷登录。请妥善保管微信账户及设备；通过该账户完成的操作将记录在对应兑奖账户中。' },
				{ title: '兑换与领奖', items: ['兑换码应来自正规活动商品，并在有效期内使用。', '同一兑换码只能使用一次，每个微信账户的每日兑奖次数以活动页面显示和后台设置为准。', '中奖后应在有效期内前往可核销门店，按页面提示完成领奖。'] },
				{ title: '使用规范', text: '不得伪造兑换码、恶意请求接口、绕过次数限制、冒用他人账户或以其他方式干扰活动。异常行为可能被限制使用并留存安全审计记录。' },
				{ title: '服务变更', text: '活动时间、奖品库存、参与门店及规则可能依法依规调整。重要变化将通过活动页面或服务通知进行说明。' },
				{ title: '问题反馈', text: '如对兑奖结果、核销状态或账户记录有疑问，可通过小程序个人中心展示的客服方式联系我们。' }
			]
		},
		privacy: {
			title: '隐私政策',
			intro: '本政策说明倌榔一码兑奖服务如何处理与你有关的信息。',
			sections: [
				{ title: '我们收集的信息', items: ['微信提供的账户标识，用于识别你的兑奖账户。', '兑换码、抽奖结果、奖品、优惠券、意向门店和核销记录。', '请求时间、网络地址与必要的安全日志，用于防作弊和故障排查。', '手机号不会自动获取，只有在你另行主动授权后才会处理。'] },
				{ title: '信息使用目的', text: '我们仅将信息用于完成登录、兑奖、领奖核销、记录查询、服务通知、风险控制以及保障系统稳定运行。' },
				{ title: '存储与保护', text: '业务数据保存在受访问控制保护的服务器和数据库中。我们采用身份校验、权限隔离、传输加密和操作审计等措施降低数据风险。' },
				{ title: '共享与披露', text: '除完成门店核销所必需的信息、依法履行义务或取得你的明确同意外，我们不会向无关第三方提供你的个人信息。门店只能查看其权限范围内的核销数据。' },
				{ title: '你的权利', text: '你可以在小程序中查看兑奖记录和账户信息。如需更正、删除相关信息或撤回授权，可通过个人中心的客服方式提出申请。' },
				{ title: '未成年人保护', text: '未成年人应在监护人指导下参与活动并使用本服务；涉及领奖时，应遵守活动规则及适用法律要求。' }
			]
		}
	}

	export default {
		// #ifdef MP-WEIXIN
		onShareAppMessage() { return activityShare() },
		// #endif
		data() {
			return { title: '', intro: '', sections: [] }
		},
		onLoad(options) {
			const document = DOCUMENTS[options.type] || DOCUMENTS.agreement
			this.title = document.title
			this.intro = document.intro
			this.sections = document.sections
		}
	}
</script>

<style lang="scss" scoped>
	.legal-page {
		min-height: 100vh;
		background-color: $bl-paper;
	}

	.legal-wrap {
		padding: 34rpx $bl-pad calc(56rpx + env(safe-area-inset-bottom));
	}

	.legal-head {
		padding-bottom: 32rpx;
		border-bottom: 1rpx solid rgba(184, 137, 43, 0.34);
		display: flex;
		flex-direction: column;
	}

	.legal-title {
		color: $bl-ink;
		font-size: 44rpx;
		font-weight: 800;
		letter-spacing: 1rpx;
	}

	.legal-intro {
		margin-top: 16rpx;
		max-width: 650rpx;
		color: $bl-ink-2;
		font-size: 26rpx;
		line-height: 1.75;
	}

	.legal-date {
		margin-top: 16rpx;
		color: $bl-ink-3;
		font-size: 22rpx;
	}

	.legal-body {
		padding-top: 10rpx;
	}

	.legal-section {
		padding: 32rpx 0 30rpx;
		border-bottom: 1rpx solid $bl-line;
	}

	.section-heading {
		display: flex;
		align-items: baseline;
		gap: 16rpx;
		margin-bottom: 16rpx;
	}

	.section-index {
		color: $bl-gold;
		font-size: 21rpx;
		font-weight: 750;
		letter-spacing: 1rpx;
	}

	.section-title {
		color: $bl-ink;
		font-size: 31rpx;
		font-weight: 750;
	}

	.section-text,
	.section-item {
		color: $bl-ink-2;
		font-size: 26rpx;
		line-height: 1.85;
	}

	.section-item {
		display: flex;
		align-items: flex-start;
		gap: 14rpx;
		margin-top: 10rpx;
	}

	.item-dot {
		width: 8rpx;
		height: 8rpx;
		margin-top: 20rpx;
		border-radius: 50%;
		background: $bl-gold;
		flex-shrink: 0;
	}

	.legal-foot {
		margin-top: 34rpx;
		padding: 24rpx;
		border: 1rpx solid rgba(67, 118, 171, 0.18);
		border-radius: $bl-r-md;
		background: $bl-green-lt;
		display: flex;
		align-items: flex-start;
		gap: 14rpx;
		color: $bl-ink-2;
		font-size: 24rpx;
		line-height: 1.65;
	}
</style>
