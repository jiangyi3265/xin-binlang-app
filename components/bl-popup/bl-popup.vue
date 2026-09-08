<template>
	<view v-if="render" class="pp" :class="{ 'pp--show': visible }">
		<view class="pp-mask" @tap="onMask"></view>
		<view class="pp-body" :class="'pp-body--' + type">
			<slot></slot>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'bl-popup',
		props: {
			show: { type: Boolean, default: false },
			/* center 居中 / bottom 底部弹出 */
			type: { type: String, default: 'center' },
			maskClose: { type: Boolean, default: true }
		},
		emits: ['update:show', 'close'],
		data() {
			return { render: false, visible: false, timer: null }
		},
		watch: {
			show: {
				immediate: true,
				handler(v) {
					if (v) {
						clearTimeout(this.timer)
						this.render = true
						setTimeout(() => { this.visible = true }, 20)
					} else {
						this.visible = false
						clearTimeout(this.timer)
						this.timer = setTimeout(() => { this.render = false }, 240)
					}
				}
			}
		},
		methods: {
			onMask() {
				if (!this.maskClose) return
				this.$emit('update:show', false)
				this.$emit('close')
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pp {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 900;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pp-mask {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: $bl-mask;
		opacity: 0;
		transition: opacity 0.24s ease;
	}

	.pp--show .pp-mask {
		opacity: 1;
	}

	.pp-body {
		position: relative;
		z-index: 2;
		transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
	}

	.pp-body--center {
		opacity: 0;
		transform: scale(0.9);
	}

	.pp--show .pp-body--center {
		opacity: 1;
		transform: scale(1);
	}

	.pp-body--bottom {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		transform: translateY(100%);
	}

	.pp--show .pp-body--bottom {
		transform: translateY(0);
	}
</style>
