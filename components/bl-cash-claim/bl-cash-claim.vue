<template>
	<view class="cash-claim">
		<text class="cash-kicker">倌榔现金红包</text><text class="cash-amount">¥{{ record.prizeValue }}</text>
		<text class="cash-state">{{ statusLabel }}</text>
		<text class="cash-desc">{{ description }}</text>
		<button v-if="canClaim" class="cash-button" :disabled="busy" @tap="claim">{{ busy ? '正在处理…' : payment.state === 'WAIT_USER_CONFIRM' ? '确认微信收款' : '领取到微信零钱' }}</button>
		<button v-if="!canClaim && record.status === 'pending'" class="cash-button" :disabled="busy" @tap="refresh(true)">刷新领取状态</button>
		<text v-if="error" class="cash-error">{{ error }}</text>
		<text class="cash-note">无需门店核销 · 可返回本页继续领取</text>
	</view>
</template>
<script>
import { cashStatus, claimCash } from '@/utils/cash.js'
export default {
	props: { record: { type: Object, required: true } }, emits: ['updated'],
	data() { return { payment: {}, busy: false, querying: false, error: '' } },
	computed: {
		statusLabel() { return this.record.status === 'expired' ? '红包已失效' : this.record.status === 'frozen' ? '红包已冻结' : this.payment.label || (this.record.cashState === 'SUCCESS' ? '已到账' : '待领取') },
		canClaim() { return this.record.status === 'pending' && !['SUCCESS','FAIL','CANCELLED','REVIEW_REQUIRED','CANCELING','TRANSFERING','PROCESSING','ACCEPTED'].includes(this.payment.state) },
		description() { if (this.record.cashState === 'SUCCESS' || this.payment.state === 'SUCCESS') return '现金已到账，请在微信零钱明细中查看。'; if (['FAIL','CANCELLED','REVIEW_REQUIRED'].includes(this.payment.state)) return '请联系客服核对领取结果，保留此凭证。'; if (this.payment.ready === false) return '现金领取暂未开放，你的中奖凭证已保留。'; return '点击领取后，按微信提示确认收款。实际到账状态以微信转账结果为准。' }
	},
	mounted() { this.refresh() },
	methods: {
		async refresh(manual = false) { if (this.querying) return; this.querying = true; try { this.payment = await cashStatus(this.record.id); if (manual) this.error = ''; if (this.payment.state === 'SUCCESS' && this.record.cashState !== 'SUCCESS') this.$emit('updated') } catch (error) { if (manual) this.error = error.message || '暂时无法刷新，请稍后重试' } finally { this.querying = false } },
		async claim() { if (this.busy) return; this.busy = true; this.error = ''; try { this.payment = await claimCash(this.record.id); this.$emit('updated') } catch (error) { this.error = error.message || '领取结果正在确认，请稍后刷新' } finally { this.busy = false } }
	}
}
</script>
<style lang="scss" scoped>
.cash-claim{display:flex;flex-direction:column;align-items:center;padding:14rpx 10rpx;color:$bl-ink;text-align:center}.cash-kicker{font-size:24rpx;color:$bl-gold}.cash-amount{font-size:80rpx;font-weight:800;line-height:1.4;margin:12rpx 0;color:$bl-green}.cash-state{font-size:30rpx;font-weight:700}.cash-desc{font-size:25rpx;line-height:1.8;color:$bl-ink-2;margin-top:16rpx}.cash-button{width:100%;min-height:88rpx;margin-top:28rpx;padding:16rpx;border-radius:14rpx;background:$bl-green;color:#fff;font-size:28rpx;line-height:1.6}.cash-button:after{border:0}.cash-button[disabled]{background:#d9e3ed;color:#60768c}.cash-error{font-size:24rpx;line-height:1.7;color:$bl-danger;margin-top:20rpx}.cash-note{font-size:22rpx;color:$bl-ink-3;margin-top:22rpx}
</style>
