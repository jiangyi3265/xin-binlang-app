<template>
	<view class="nb-root">
		<view class="nb" :class="['nb--' + bg, fixed ? 'is-fixed' : '']">
			<view class="nb-status" :style="'height:' + statusH + 'px'"></view>
			<view class="nb-bar">
				<view class="nb-left" @tap="onBack">
					<view v-if="showBack" class="nb-back">
						<bl-icon name="chevron-left" :size="42" :color="iconColor" :weight="2.2" />
					</view>
					<slot name="left"></slot>
				</view>
				<view class="nb-title" :style="'color:' + textColor">
					<slot name="title">{{ title }}</slot>
				</view>
				<view class="nb-right">
					<slot name="right"></slot>
				</view>
			</view>
		</view>
		<!-- 占位，避免固定定位盖住内容 -->
		<view v-if="fixed && placeholder" :style="'height:' + (statusH + 44) + 'px'"></view>
	</view>
</template>

<script>
	let sysCache = null

	function sys() {
		if (!sysCache) {
			try {
				sysCache = uni.getSystemInfoSync()
			} catch (e) {
				sysCache = { statusBarHeight: 20 }
			}
		}
		return sysCache
	}

	export default {
		name: 'bl-navbar',
		props: {
			title: { type: String, default: '' },
			/* paper 米白 / transparent 透明（配图） / green 墨绿 / white 纯白 */
			bg: { type: String, default: 'paper' },
			showBack: { type: Boolean, default: true },
			fixed: { type: Boolean, default: true },
			placeholder: { type: Boolean, default: true },
			/* 返回时若无上级页面，回退到该路径 */
			home: { type: String, default: '/pages/index/index' }
		},
		data() {
			return { statusH: sys().statusBarHeight || 20 }
		},
		computed: {
			dark() {
				return this.bg === 'transparent' || this.bg === 'green'
			},
			textColor() {
				return this.dark ? '#F5F9FD' : '#172D45'
			},
			iconColor() {
				return this.dark ? '#F5F9FD' : '#172D45'
			},
			rootStyle() {
				return ''
			}
		},
		methods: {
			onBack() {
				if (!this.showBack) return
				const pages = getCurrentPages()
				if (pages.length > 1) {
					uni.navigateBack()
				} else {
					uni.reLaunch({ url: this.home })
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.nb {
		width: 100%;
		z-index: 100;

		&.is-fixed {
			position: fixed;
			left: 0;
			top: 0;
		}
	}

	.nb--paper {
		background: $bl-paper;
		border-bottom: 1rpx solid rgba(230, 225, 212, 0.7);
	}

	.nb--white {
		background: $bl-card;
		border-bottom: 1rpx solid $bl-line-2;
	}

	.nb--green {
		background: linear-gradient(180deg, $bl-green 0%, $bl-green-2 100%);
	}

	.nb--transparent {
		background: transparent;
	}

	.nb-bar {
		height: 44px;
		display: flex;
		align-items: center;
		padding: 0 12rpx;
		position: relative;
	}

	.nb-left {
		min-width: 96rpx;
		display: flex;
		align-items: center;
		z-index: 2;
	}

	.nb-back {
		width: 68rpx;
		height: 68rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nb-title {
		position: absolute;
		left: 160rpx;
		right: 160rpx;
		text-align: center;
		font-size: 34rpx;
		font-weight: 700;
		letter-spacing: 1rpx;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.nb-right {
		margin-left: auto;
		min-width: 96rpx;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 12rpx;
		z-index: 2;
	}
</style>
