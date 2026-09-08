<template>
	<view class="ep">
		<view class="ep-ico">
			<bl-icon :name="icon" :size="72" color="#C3CCC6" :weight="1.5" />
		</view>
		<text class="ep-t">{{ text }}</text>
		<text v-if="sub" class="ep-s">{{ sub }}</text>
		<view v-if="btn" class="ep-btn bl-btn bl-btn-ghost bl-btn-sm" @tap="$emit('action')">
			<text>{{ btn }}</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'bl-empty',
		props: {
			icon: { type: String, default: 'box' },
			text: { type: String, default: '暂无数据' },
			sub: { type: String, default: '' },
			btn: { type: String, default: '' }
		},
		emits: ['action']
	}
</script>

<style lang="scss" scoped>
	.ep {
		padding: 110rpx 0 90rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.ep-ico {
		width: 136rpx;
		height: 136rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.75);
		border: 1rpx dashed $bl-line;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ep-t {
		margin-top: 26rpx;
		font-size: $bl-fs-sm;
		color: $bl-ink-3;
		font-weight: 600;
	}

	.ep-s {
		margin-top: 10rpx;
		font-size: $bl-fs-xs;
		color: $bl-ink-4;
	}

	.ep-btn {
		margin-top: 32rpx;
	}
</style>
