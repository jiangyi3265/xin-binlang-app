<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="核销日志" bg="paper" home="/pagesStore/home/home" />

		<view v-if="!canView" class="deny">
			<bl-icon name="lock" :size="72" color="#B4BFB8" :weight="1.5" />
			<text class="deny-t">店员账号无日志查看权限</text>
		</view>

		<template v-else>
			<view class="bl-wrap">
				<view class="notice">
					<bl-icon name="shield-check" :size="30" color="#2C7256" :weight="1.8" />
					<view class="notice-txt">
						<text class="notice-t">全平台操作留痕</text>
						<text class="notice-d">核销与拦截日志均记录操作人、时间与门店定位，永久保存且不可删除</text>
					</view>
				</view>

				<view class="filter">
					<view v-for="f in filters" :key="f.k" class="fi" :class="{ on: kind === f.k }"
						@tap="kind = f.k">
						<text>{{ f.t }}</text>
						<text class="fi-n">{{ f.n }}</text>
					</view>
				</view>

				<bl-empty v-if="!list.length" icon="history" text="暂无日志" />

				<view class="line-wrap">
					<view v-for="(l, i) in list" :key="l.id" class="lg">
						<view class="lg-l">
							<view class="lg-dot" :class="l.type">
								<bl-icon :name="l.type === 'verify' ? 'check' : 'ban'" :size="22"
									color="#fff" :weight="2.4" />
							</view>
							<view v-if="i < list.length - 1" class="lg-line"></view>
						</view>
						<view class="lg-r bl-card">
							<view class="lg-h">
								<text class="lg-code bl-num">{{ l.code }}</text>
								<text class="bl-tag" :class="l.type === 'verify' ? 'bl-tag-green' : 'bl-tag-red'">
									{{ l.type === 'verify' ? '核销成功' : '拦截' }}
								</text>
							</view>
							<text class="lg-p">{{ l.prizeName }} · 顾客 {{ l.userNick }}</text>
							<view class="lg-kv">
								<bl-icon name="user-check" :size="22" color="#8B9A92" :weight="1.8" />
								<text class="lg-kv-t">操作人 {{ l.byName }}</text>
							</view>
							<view class="lg-kv">
								<bl-icon name="clock" :size="22" color="#8B9A92" :weight="1.8" />
								<text class="lg-kv-t">{{ fmt(l.at, 'YYYY-MM-DD HH:mm:ss') }}</text>
							</view>
							<view class="lg-kv">
								<bl-icon name="map-pin" :size="22" color="#8B9A92" :weight="1.8" />
								<text class="lg-kv-t">{{ l.pos }}</text>
							</view>
							<view v-if="l.type !== 'verify'" class="lg-res">
								<text>{{ l.result }}</text>
							</view>
						</view>
					</view>
				</view>

				<view v-if="list.length" class="tail">
					<view class="tail-line"></view>
					<text class="tail-t">日志不可删除 · 共 {{ list.length }} 条</text>
					<view class="tail-line"></view>
				</view>
			</view>
		</template>

		<bl-storebar active="home" />
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { fmt } from '@/utils/date.js'

	export default {
		data() {
			return { kind: 'all' }
		},
		computed: {
			canView() { return store.canViewData() },
			all() { return store.storeLogs() },
			filters() {
				return [
					{ k: 'all', t: '全部', n: this.all.length },
					{ k: 'verify', t: '核销成功', n: this.all.filter(l => l.type === 'verify').length },
					{ k: 'block', t: '拦截记录', n: this.all.filter(l => l.type !== 'verify').length }
				]
			},
			list() {
				if (this.kind === 'all') return this.all
				if (this.kind === 'verify') return this.all.filter(l => l.type === 'verify')
				return this.all.filter(l => l.type !== 'verify')
			}
		},
		onShow() {
			if (!store.account()) uni.redirectTo({ url: '/pagesStore/login/login' })
		},
		methods: { fmt }
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
	}

	.deny {
		padding: 200rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.deny-t {
		margin-top: 24rpx;
		font-size: 28rpx;
		color: $bl-ink-3;
	}

	.notice {
		margin-top: 14rpx;
		display: flex;
		align-items: flex-start;
		padding: 22rpx;
		background: $bl-green-lt;
		border: 1rpx solid rgba(44, 114, 86, 0.2);
		border-radius: $bl-r-md;
	}

	.notice-txt {
		flex: 1;
		margin-left: 14rpx;
	}

	.notice-t {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #1E5540;
	}

	.notice-d {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: #40705C;
		line-height: 1.5;
	}

	.filter {
		margin-top: 24rpx;
		display: flex;
	}

	.fi {
		height: 60rpx;
		padding: 0 24rpx;
		border-radius: $bl-r-pill;
		background: #fff;
		border: 1rpx solid $bl-line;
		display: flex;
		align-items: center;
		margin-right: 16rpx;

		text {
			font-size: 24rpx;
			color: $bl-ink-2;
		}

		&.on {
			background: $bl-green;
			border-color: $bl-green;

			text {
				color: #FFF6E6;
				font-weight: 700;
			}
		}
	}

	.fi-n {
		margin-left: 8rpx;
		font-size: 20rpx !important;
		opacity: 0.75;
	}

	.line-wrap {
		margin-top: 24rpx;
	}

	.lg {
		display: flex;
	}

	.lg-l {
		width: 48rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.lg-dot {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 22rpx;

		&.verify {
			background: $bl-ok;
		}

		&.block {
			background: $bl-red;
		}
	}

	.lg-line {
		flex: 1;
		width: 2rpx;
		background: $bl-line;
		margin: 8rpx 0;
	}

	.lg-r {
		flex: 1;
		margin-left: 18rpx;
		margin-bottom: 20rpx;
		padding: 22rpx;
	}

	.lg-h {
		display: flex;
		align-items: center;
	}

	.lg-code {
		flex: 1;
		font-size: 30rpx;
		color: $bl-ink;
		letter-spacing: 2rpx;
	}

	.lg-p {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: $bl-ink-2;
	}

	.lg-kv {
		margin-top: 8rpx;
		display: flex;
		align-items: center;
	}

	.lg-kv-t {
		margin-left: 8rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
		flex: 1;
	}

	.lg-res {
		margin-top: 14rpx;
		padding: 12rpx 16rpx;
		background: $bl-red-lt;
		border-radius: $bl-r-xs;

		text {
			font-size: 21rpx;
			color: #8E2A20;
		}
	}

	.tail {
		margin-top: 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tail-line {
		width: 70rpx;
		height: 1rpx;
		background: $bl-line;
	}

	.tail-t {
		margin: 0 18rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
	}
</style>
