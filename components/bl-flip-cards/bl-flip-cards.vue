<template>
	<view class="flip-grid" :class="{ 'has-selection': selected > 0 }">
		<button v-for="card in 6" :key="card" class="flip-card" :class="{ selected: selected === card, revealed: revealed && selected === card, muted: selected > 0 && selected !== card }"
			:disabled="busy || selected > 0" role="button" :aria-label="revealed && selected === card ? title + '，' + detail : '选择第 ' + card + ' 张牌'" @tap="$emit('select', card)">
			<view class="flip-inner">
				<view class="flip-face flip-back" :aria-hidden="revealed && selected === card" :style="background ? { backgroundImage: 'url(' + background + ')' } : {}">
					<view class="flip-border"></view><text class="flip-brand">{{ brand }}</text><text class="flip-en">GUANLANG</text>
					<view class="flip-mark">礼</view><text class="flip-prompt">{{ busy && selected === card ? '正在开奖' : '选我翻牌' }}</text>
				</view>
				<view class="flip-face flip-front" :aria-hidden="!revealed || selected !== card" :class="'reward-' + rewardType">
					<template v-if="selected === card">
					<text class="flip-result-kicker">{{ rewardType === 'lose' ? '感谢参与' : '你的奖励' }}</text>
					<text class="flip-result-title">{{ title }}</text><text class="flip-result-detail">{{ detail }}</text>
					</template>
				</view>
			</view>
		</button>
	</view>
</template>

<script>
export default {
	emits: ['select'],
	props: { brand: { type: String, default: '倌榔' }, background: String, selected: { type: Number, default: 0 }, busy: Boolean, revealed: Boolean,
		rewardType: { type: String, default: 'lose' }, title: String, detail: String }
}
</script>

<style lang="scss" scoped>
.flip-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18rpx}
.flip-card{display:block;position:relative;padding:0;margin:0;width:100%;height:260rpx;border:0;border-radius:18rpx;background:transparent;overflow:visible;perspective:1000px;line-height:1.4;transition:opacity .25s,transform .25s}
.flip-card::after{border:0}.flip-card[disabled]{color:inherit;opacity:1}.flip-card.muted{opacity:.38;transform:scale(.96)}
.flip-inner{position:relative;display:block;width:100%;height:100%;transform-style:preserve-3d;transition:transform .65s cubic-bezier(.2,.75,.2,1)}
.revealed .flip-inner{transform:rotateY(180deg)}
.flip-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:18rpx;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;box-sizing:border-box}
.flip-back{color:#e5c58a;background-color:#102e53;background-size:auto 100%;background-position:center;border:1rpx solid #cfa356;box-shadow:0 8rpx 20rpx rgba(9,31,59,.13)}
.flip-border{position:absolute;inset:10rpx;border:1rpx solid rgba(229,197,138,.5);border-radius:10rpx;pointer-events:none}
.flip-brand{font-size:26rpx;font-weight:700;letter-spacing:4rpx}.flip-en{font-size:12rpx;letter-spacing:2rpx;margin-top:2rpx}
.flip-mark{display:flex;align-items:center;justify-content:center;width:66rpx;height:66rpx;border:1rpx solid rgba(229,197,138,.6);border-radius:50%;font-size:34rpx;margin:20rpx 0 16rpx}
.flip-prompt{font-size:20rpx;color:#eaf1f8}
.flip-front{transform:rotateY(180deg);background:#fffaf0;border:2rpx solid #cfa356;padding:18rpx;color:#172d45;text-align:center}
.flip-result-kicker{font-size:19rpx;color:#60768c}.flip-result-title{font-size:34rpx;line-height:1.2;font-weight:800;margin:16rpx 0 12rpx;overflow-wrap:anywhere}
.flip-result-detail{font-size:21rpx;line-height:1.5;color:#94692b}.reward-lose{background:#f7f9fc;border-color:#bbcbda}.reward-lose .flip-result-title{font-size:30rpx}.reward-cash{background:#fff7e7}
@media(prefers-reduced-motion:reduce){.flip-inner,.flip-card{transition:none}}
</style>
