<template>
	<view class="flip-grid" :class="{ 'has-selection': selected > 0, 'theme-gold': theme === 'gold' }">
		<button v-for="card in 6" :key="card" class="flip-card" :class="{ selected: selected === card, revealed: revealed, muted: selected > 0 && selected !== card, preview: revealed && selected !== card }"
			:disabled="disabled || busy || selected > 0" role="button" :aria-label="disabled ? '活动暂未开放' : revealed ? (selected === card ? title + '，' + detail : '奖池展示：' + previewFor(card).title) : '选择第 ' + card + ' 张牌'" @tap="$emit('select', card)">
			<view class="flip-inner">
				<view class="flip-face flip-back" :aria-hidden="revealed">
					<view class="flip-texture" :class="{ golden: tint }" :style="background ? { backgroundImage: 'url(' + background + ')' } : {}"></view><view class="flip-border"></view><text class="flip-brand">{{ brand }}</text><text class="flip-en">GUANLANG</text>
					<view class="flip-mark">礼</view><text class="flip-prompt">{{ disabled ? '暂未开放' : busy && selected === card ? '正在开奖' : '选我翻牌' }}</text>
				</view>
				<view class="flip-face flip-front" :aria-hidden="!revealed" :class="'reward-' + rewardType">
					<template v-if="selected === card">
					<text class="flip-result-kicker">{{ rewardType === 'lose' ? '感谢参与' : '你的奖励' }}</text>
					<text class="flip-result-title">{{ title }}</text><text class="flip-result-detail">{{ detail }}</text>
					</template>
                    <template v-else-if="revealed"><text class="flip-result-kicker">奖池展示</text><text class="flip-result-title">{{ previewFor(card).title }}</text><text class="flip-result-detail">{{ previewFor(card).detail }}</text></template>
				</view>
			</view>
		</button>
	</view>
</template>

<script>
export default {
	emits: ['select'],
	methods: { previewFor(card) { return this.previews.length ? this.previews[(card - 1) % this.previews.length] : { title: '活动好礼', detail: '以奖池配置为准' } } },
	props: { previews: { type: Array, default: () => [] }, theme: String, tint: Boolean, brand: { type: String, default: '倌榔' }, background: String, selected: { type: Number, default: 0 }, busy: Boolean, disabled: Boolean, revealed: Boolean,
		rewardType: { type: String, default: 'lose' }, title: String, detail: String }
}
</script>

<style lang="scss" scoped>
.flip-texture{position:absolute;inset:0;background-size:auto 100%;background-position:center;opacity:.8}.golden{filter:sepia(1) saturate(1.1) hue-rotate(345deg)}.theme-gold .flip-back{background-color:#482719}.flip-back>text,.flip-mark{position:relative}.flip-card.preview{opacity:1;transform:scale(.96)}.preview .flip-front{background:#f0f4f8;border-color:#bdcbd8}.preview .flip-result-title{font-size:28rpx;color:#60768c}.preview .flip-result-detail{color:#60768c}

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
.flip-card.preview{opacity:1}
</style>
