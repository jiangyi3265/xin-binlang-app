<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="可核销门店" bg="paper" />

		<view class="bl-wrap">
			<view class="search">
				<bl-icon name="search" :size="32" color="#60768C" :weight="1.9" />
				<input class="search-in" v-model="kw" placeholder="搜索门店名称或地址"
					placeholder-class="search-ph" confirm-type="search" />
				<view v-if="kw" class="search-x" @tap="kw = ''">
					<bl-icon name="x-circle" :size="30" color="#C3CCC6" :weight="1.8" fill />
				</view>
			</view>

			<view class="hint">
				<bl-icon name="shield-check" :size="26" color="#4376AB" :weight="1.8" />
				<text class="hint-t">中奖凭证在下列任意门店均可核销，共 {{ stores.length }} 家</text>
			</view>

			<bl-empty v-if="!list.length" icon="store" text="没有找到匹配的门店" sub="换个关键词试试" />

			<view v-for="(s, i) in list" :key="s.id" class="st bl-card">
				<image class="st-img" :src="s.img" mode="aspectFill" />
				<view class="st-no" v-if="i < 3">
					<text>{{ ['旗舰', '热门', '新店'][i] }}</text>
				</view>
				<view class="st-body">
					<view class="st-h">
						<text class="st-n">{{ s.short }}</text>
						<text class="st-d bl-num">{{ s.distance }} km</text>
					</view>
					<view class="st-r">
						<bl-icon name="map-pin" :size="24" color="#60768C" :weight="1.8" />
						<text class="st-a">{{ s.addr }}</text>
					</view>
					<view class="st-r">
						<bl-icon name="clock" :size="24" color="#60768C" :weight="1.8" />
						<text class="st-a">营业时间 {{ s.open }}</text>
					</view>
					<view class="st-tags">
						<text class="bl-tag bl-tag-green">支持核销</text>
						<text class="bl-tag bl-tag-gold">累计核销 {{ s.verified }} 单</text>
					</view>
					<view class="st-btns">
						<view class="st-btn" @tap="call(s)">
							<bl-icon name="phone" :size="28" color="#102E53" :weight="1.8" />
							<text class="st-btn-t">拨打电话</text>
						</view>
						<view class="st-btn" @tap="nav(s)">
							<bl-icon name="navigation" :size="28" color="#102E53" :weight="1.8" />
							<text class="st-btn-t">导航前往</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import store from '@/store/index.js'

	export default {
		data() {
			return { kw: '' }
		},
		computed: {
			stores() { return store.STORES },
			list() {
				const k = this.kw.trim()
				if (!k) return this.stores
				return this.stores.filter(s => s.name.indexOf(k) > -1 || s.addr.indexOf(k) > -1)
			}
		},
		methods: {
			call(s) {
				uni.makePhoneCall({ phoneNumber: s.phone, fail: () => {} })
			},
			nav(s) {
				uni.openLocation({
					latitude: s.lat,
					longitude: s.lng,
					name: s.name,
					address: s.addr,
					fail: () => uni.showToast({ title: '未能获取定位，请检查微信定位权限', icon: 'none' })
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

	.search {
		margin-top: 12rpx;
		height: 84rpx;
		background: #fff;
		border: 1rpx solid $bl-line;
		border-radius: $bl-r-pill;
		display: flex;
		align-items: center;
		padding: 0 26rpx;
	}

	.search-in {
		flex: 1;
		margin-left: 14rpx;
		font-size: 27rpx;
		color: $bl-ink;
	}

	.search-ph {
		color: $bl-ink-4;
		font-size: 26rpx;
	}

	.search-x {
		padding-left: 12rpx;
	}

	.hint {
		margin-top: 22rpx;
		display: flex;
		align-items: center;
	}

	.hint-t {
		margin-left: 8rpx;
		font-size: 22rpx;
		color: $bl-ink-3;
	}

	.st {
		margin-top: 22rpx;
		overflow: hidden;
		position: relative;
	}

	.st-img {
		width: 100%;
		height: 260rpx;
	}

	.st-no {
		position: absolute;
		left: 0;
		top: 24rpx;
		height: 40rpx;
		padding: 0 18rpx 0 16rpx;
		border-radius: 0 20rpx 20rpx 0;
		background: linear-gradient(135deg, #D6B16D, #A97834);
		display: flex;
		align-items: center;

		text {
			color: #F5F9FD;
			font-size: 20rpx;
			font-weight: 700;
			letter-spacing: 2rpx;
		}
	}

	.st-body {
		padding: 24rpx 26rpx 26rpx;
	}

	.st-h {
		display: flex;
		align-items: baseline;
	}

	.st-n {
		flex: 1;
		font-size: 32rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.st-d {
		font-size: 26rpx;
		color: $bl-gold;
	}

	.st-r {
		margin-top: 10rpx;
		display: flex;
		align-items: center;
	}

	.st-a {
		flex: 1;
		margin-left: 8rpx;
		font-size: 23rpx;
		color: $bl-ink-3;
	}

	.st-tags {
		margin-top: 16rpx;
		display: flex;

		text {
			margin-right: 12rpx;
		}
	}

	.st-btns {
		margin-top: 22rpx;
		padding-top: 20rpx;
		border-top: 1rpx dashed $bl-line;
		display: flex;
	}

	.st-btn {
		flex: 1;
		height: 76rpx;
		border-radius: $bl-r-sm;
		background: $bl-paper-2;
		border: 1rpx solid $bl-line;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;

		&:last-child {
			margin-right: 0;
		}
	}

	.st-btn-t {
		margin-left: 10rpx;
		font-size: 25rpx;
		color: $bl-green;
		font-weight: 600;
	}
</style>
