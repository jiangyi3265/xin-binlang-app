<template>
	<view class="pg bl-paper-tex">
		<!-- ============ 顶部主视觉 ============ -->
		<view class="hero">
			<image class="hero-bg" :src="cfg.homeBg" mode="aspectFill" />
			<view class="hero-mask"></view>

			<view class="hero-in" :style="'padding-top:' + (statusH + 16) + 'px'">
				<!-- 品牌行 -->
				<view class="brand">
					<view class="brand-l">
						<image v-if="cfg.brandLogo" class="seal seal-logo" :src="cfg.brandLogo" mode="aspectFill" />
						<view v-else class="seal"><text>{{ cfg.brandMark }}</text></view>
						<view>
							<view class="brand-n">{{ cfg.brand }}</view>
							<view class="brand-e">{{ cfg.brandEn }}</view>
						</view>
					</view>
					<view class="brand-r">
						<view class="ico-btn" @tap="go('/pages/notice/notice')">
							<bl-icon name="bell" :size="38" color="#FFF3DA" :weight="1.7" />
							<view v-if="logged && unread" class="badge"><text>{{ unread }}</text></view>
						</view>
						<image v-if="logged && user.avatar" class="avatar" :src="user.avatar" mode="aspectFill"
							@tap="go('/pages/user/user')" />
						<view v-else class="avatar avatar-guest" @tap="go('/pages/user/user')">
							<bl-icon name="user" :size="34" color="#F0D79A" :weight="1.7" />
						</view>
					</view>
				</view>

				<!-- 活动主标题 -->
				<view class="hero-t">
					<view class="hero-t1">{{ cfg.actName }}</view>
					<view class="hero-t2">{{ cfg.actSub }}</view>
					<view class="hero-chip">
						<bl-icon name="calendar" :size="24" color="#F0D79A" :weight="1.8" />
						<text class="hero-chip-t">活动期 {{ cfg.actStart }} 至 {{ cfg.actEnd }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- ============ 兑奖入口卡 ============ -->
		<view class="bl-wrap">
			<view class="entry">
				<view class="entry-top">
					<image class="entry-img" :src="cfg.productImg" mode="aspectFit" />
					<view class="entry-txt">
						<view class="entry-t1">撕开包装，输入 6 位数字码</view>
						<view class="entry-t2">{{ cfg.slogan }}</view>
						<view class="entry-tags">
							<text class="bl-tag bl-tag-gold">一码一兑</text>
							<text class="bl-tag bl-tag-green">实时开奖</text>
						</view>
					</view>
				</view>
				<view class="entry-btn bl-btn bl-btn-gold" @tap="go('/pages/redeem/redeem')">
					<bl-icon name="sparkles" :size="36" color="#3B2A06" :weight="2" />
					<text class="entry-btn-t">立即兑奖</text>
				</view>
				<view class="entry-tip">
					<bl-icon name="info" :size="24" color="#8B9A92" :weight="1.8" />
					<text v-if="unlimited" class="entry-tip-t">今日兑奖不限次数</text>
					<text v-else class="entry-tip-t">今日还可兑奖
						<text class="entry-num">{{ left }}</text> 次 · 每日上限 {{ cfg.dailyLimit }} 次
					</text>
				</view>
			</view>

			<!-- 滚动播报 -->
			<view class="marquee">
				<bl-icon name="megaphone" :size="30" color="#B8892B" :weight="1.8" />
				<view class="marquee-box">
					<view class="marquee-in" :style="'animation-duration:' + (cfg.marquee.length * 5) + 's'">
						<text v-for="(m, i) in cfg.marquee" :key="i" class="marquee-t">{{ m }}　·　</text>
						<text v-for="(m, i) in cfg.marquee" :key="'b' + i" class="marquee-t">{{ m }}　·　</text>
					</view>
				</view>
			</view>

			<!-- ============ 我的奖品概览 ============ -->
			<!-- 未登录只放一条邀请，不拦页、不弹窗：用户可以一直逆着看完整个首页 -->
			<view v-if="!logged" class="guest bl-card" @tap="login">
				<view class="guest-ico">
					<bl-icon name="ticket" :size="38" color="#B8892B" :weight="1.8" />
				</view>
				<view class="guest-txt">
					<text class="guest-t">登录后同步我的奖品</text>
					<text class="guest-d">兑奖记录、核销状态与优惠券一处查看</text>
				</view>
				<view class="guest-btn">
					<text>登录</text>
				</view>
			</view>

			<view v-else class="stat">
				<view class="stat-i" @tap="goTab('/pages/record/record')">
					<text class="stat-n bl-num">{{ pending }}</text>
					<text class="stat-l">待核销</text>
				</view>
				<view class="stat-x"></view>
				<view class="stat-i" @tap="goTab('/pages/record/record')">
					<text class="stat-n bl-num">{{ verified }}</text>
					<text class="stat-l">已领奖</text>
				</view>
				<view class="stat-x"></view>
				<view class="stat-i" @tap="go('/pages/coupon/coupon')">
					<text class="stat-n bl-num">{{ coupons }}</text>
					<text class="stat-l">优惠券</text>
				</view>
			</view>

			<!-- ============ 参与流程 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">参与流程</text>
					<text class="bl-sec-sub">HOW IT WORKS</text>
				</view>
			</view>
			<view class="flow bl-card">
				<view v-for="(s, i) in cfg.steps" :key="i" class="flow-i">
					<view class="flow-l">
						<view class="flow-dot">
							<bl-icon :name="s.icon" :size="36" color="#0E3B2E" :weight="1.8" />
						</view>
						<view v-if="i < cfg.steps.length - 1" class="flow-line"></view>
					</view>
					<view class="flow-r">
						<view class="flow-t">
							<text class="flow-no">0{{ i + 1 }}</text>
							<text class="flow-t1">{{ s.t }}</text>
						</view>
						<text class="flow-d">{{ s.d }}</text>
					</view>
				</view>
			</view>

			<!-- ============ 本期奖品 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">本期奖品</text>
					<text class="bl-sec-sub">PRIZES</text>
				</view>
				<view class="bl-sec-more" @tap="go('/pages/rules/rules')">
					<text>奖池规则</text>
					<bl-icon name="chevron-right" :size="24" color="#8B9A92" :weight="2" />
				</view>
			</view>
			<scroll-view class="prz" scroll-x show-scrollbar="false">
				<view class="prz-row">
					<view v-for="p in topPrizes" :key="p.id" class="prz-i">
						<image class="prz-img" :src="p.img" mode="aspectFill" />
						<view class="prz-tag" :style="'background:' + poolColor(p.pool)">
							<text>{{ poolName(p.pool) }}</text>
						</view>
						<view class="prz-b">
							<text class="prz-n bl-ellipsis">{{ p.name }}</text>
							<view class="prz-v">
								<text class="prz-v1">价值</text>
								<text class="prz-v2 bl-num">¥{{ p.value }}</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- ============ 就近门店 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">就近核销门店</text>
					<text class="bl-sec-sub">STORES</text>
				</view>
				<view class="bl-sec-more" @tap="go('/pages/store/list')">
					<text>全部 {{ stores.length }} 家</text>
					<bl-icon name="chevron-right" :size="24" color="#8B9A92" :weight="2" />
				</view>
			</view>
			<view class="st-list">
				<view v-for="s in nearStores" :key="s.id" class="st-i bl-card" @tap="go('/pages/store/list')">
					<image class="st-img" :src="s.img" mode="aspectFill" />
					<view class="st-txt">
						<text class="st-n bl-ellipsis">{{ s.short }}</text>
						<view class="st-r">
							<bl-icon name="map-pin" :size="22" color="#8B9A92" :weight="1.8" />
							<text class="st-a bl-ellipsis">{{ s.addr }}</text>
						</view>
						<view class="st-r">
							<text class="bl-tag bl-tag-green">营业 {{ s.open }}</text>
							<text class="st-d bl-num">{{ s.distance }} km</text>
						</view>
					</view>
				</view>
			</view>

			<!-- ============ 正式产品包装 ============ -->
			<view class="bl-sec">
				<view class="bl-sec-l">
					<view class="bl-sec-bar"></view>
					<text class="bl-sec-t">产品包装</text>
					<text class="bl-sec-sub">PRODUCT LINE</text>
				</view>
			</view>
			<view class="about bl-card">
				<view class="about-imgs">
					<view v-for="(item, i) in productLine" :key="i" class="about-product">
						<image class="about-img" :src="item.img" mode="aspectFit" />
						<text class="about-price">{{ item.price }}</text>
						<text class="about-weight">净含量 {{ item.weight }}</text>
					</view>
				</view>
				<view class="about-txt">
					<text class="about-t">三档正式包装 · 一袋一码</text>
					<text class="about-d">30 元墨绿装、50 元黑色装、100 元白色装。购买带有活动标识的产品，找到袋内 6 位数字兑换码，微信登录后即可兑奖。</text>
				</view>
			</view>

			<!-- ============ 业务人员入口 ============ -->
			<view class="ent-store" @tap="go('/pagesStore/login/login')">
				<view class="ent-store-l">
					<view class="ent-store-ico">
						<bl-icon name="store" :size="38" color="#B8892B" :weight="1.8" />
					</view>
					<view>
						<view class="ent-store-t">门店端 · 核销工作台</view>
						<view class="ent-store-d">店主 / 店员登录，扫码核销与数据看板</view>
					</view>
				</view>
				<bl-icon name="chevron-right" :size="30" color="#B4BFB8" :weight="2" />
			</view>
			<view class="ent-store ent-sales" @tap="go('/pagesSales/login/login')">
				<view class="ent-store-l">
					<view class="ent-store-ico ent-sales-ico">
						<bl-icon name="users" :size="38" color="#0E3B2E" :weight="1.8" />
					</view>
					<view>
						<view class="ent-store-t ent-sales-t">公司销售 · 门店拓展</view>
						<view class="ent-store-d ent-sales-d">销售账号登录，仅查看本人创建的门店</view>
					</view>
				</view>
				<bl-icon name="chevron-right" :size="30" color="#8B9A92" :weight="2" />
			</view>

			<view class="foot">
				<text class="foot-t">{{ cfg.brand }} · 促销兑奖核销系统</text>
				<text class="foot-d">{{ connectionText }}</text>
			</view>
		</view>

		<!-- ============ 活动公告弹窗 ============ -->
		<bl-popup v-model:show="showNotice" type="center">
			<view class="nt">
				<view class="nt-head">
					<image class="nt-bg" :src="cfg.notice.image || cfg.poster" mode="aspectFill" />
					<view class="nt-head-mask"></view>
					<view class="nt-badge"><text>{{ cfg.notice.badge }}</text></view>
					<text class="nt-t">{{ cfg.notice.title }}</text>
					<text class="nt-d">{{ cfg.notice.date }}</text>
				</view>
				<view class="nt-body">
					<view v-for="(l, i) in cfg.notice.lines" :key="i" class="nt-li">
						<view class="nt-li-dot"></view>
						<text class="nt-li-t">{{ l }}</text>
					</view>
					<view class="nt-btn bl-btn bl-btn-primary" @tap="showNotice = false">
						<text>{{ cfg.notice.buttonText }}</text>
					</view>
				</view>
			</view>
		</bl-popup>
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { requireCustomerLogin } from '@/utils/api.js'

	export default {
		data() {
			return {
				statusH: 20,
				showNotice: false
			}
		},
		computed: {
			cfg() { return store.state.config },
			logged() { return store.isCustomerAuthenticated() },
			productLine() {
				const prices = ['30 元', '50 元', '100 元']
				const weights = ['38g', '48g', '58g']
				return (this.cfg.sceneImgs || []).slice(0, 3).map((img, index) => ({
					img,
					price: prices[index],
					weight: weights[index]
				}))
			},
			user() { return store.state.user },
			stores() { return store.STORES },
			nearStores() { return store.STORES.slice(0, 3) },
			unread() { return store.unreadNotice() },
			unlimited() { return Number(this.cfg.dailyLimit || 0) <= 0 },
			left() { return store.todayLeft() },
			pending() { return store.myPrizeList('pending').length },
			verified() { return store.myPrizeList('verified').length },
			coupons() { return store.validCoupons().length },
			connectionText() {
				// 游客没有个人会话，onlineCustomer 天然为 false，
				// 不能拿它当连接状态，否则没登录的人永远看到“服务连接异常”。
				if (store.state.connection !== 'online') return '服务连接异常 · 请检查网络后重试'
				return store.state.onlineCustomer
					? '总部业务服务已连接 · 数据实时同步'
					: '总部业务服务已连接 · 登录后同步个人兑奖数据'
			},
			topPrizes() {
				return store.state.prizes.filter(p => p.on).slice(0, 8)
			}
		},
		onLoad() {
			try {
				this.statusH = uni.getSystemInfoSync().statusBarHeight || 20
			} catch (e) {}
			if (store.state.config.notice.on) {
				setTimeout(() => { this.showNotice = true }, 600)
			}
		},
		onShow() {
			store.tickExpire()
			// 游客态刷公开数据，登录后才拉个人数据
			store.syncActive().catch(() => {})
		},
		methods: {
			go(url) { uni.navigateTo({ url }) },
			login() { requireCustomerLogin() },
			goTab(url) { uni.switchTab({ url }) },
			poolName(id) {
				const p = store.poolById(id)
				return p ? p.name : ''
			},
			poolColor(id) {
				const p = store.poolById(id)
				return p ? p.color : '#8B9A92'
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
		padding-bottom: 60rpx;
	}

	/* ============ Hero ============ */
	.hero {
		position: relative;
		height: 560rpx;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.hero-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(170deg,
			rgba(10, 43, 33, 0.86) 0%,
			rgba(14, 59, 46, 0.72) 42%,
			rgba(14, 59, 46, 0.94) 100%);
	}

	.hero-in {
		position: relative;
		z-index: 2;
		padding-left: $bl-pad;
		padding-right: $bl-pad;
	}

	.brand {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand-l {
		display: flex;
		align-items: center;
	}

	.seal {
		width: 64rpx;
		height: 64rpx;
		border-radius: 10rpx;
		background: linear-gradient(140deg, #C8402F, #A32A1D);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 18rpx;
		box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.25);

		text {
			color: #FFF0DC;
			font-size: 34rpx;
			font-weight: 800;
		}
	}

	.seal-logo {
		display: block;
		border: 1rpx solid rgba(255, 240, 220, 0.55);
	}

	.brand-n {
		color: #FFF6E6;
		font-size: 32rpx;
		font-weight: 800;
		letter-spacing: 3rpx;
		line-height: 1.2;
	}

	.brand-e {
		color: rgba(240, 215, 154, 0.72);
		font-size: 18rpx;
		letter-spacing: 4rpx;
	}

	.brand-r {
		display: flex;
		align-items: center;
	}

	.ico-btn {
		position: relative;
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.14);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 18rpx;
	}

	.badge {
		position: absolute;
		right: -4rpx;
		top: -4rpx;
		min-width: 30rpx;
		height: 30rpx;
		padding: 0 6rpx;
		border-radius: 15rpx;
		background: $bl-red;
		border: 2rpx solid rgba(14, 59, 46, 0.9);

		text {
			color: #fff;
			font-size: 18rpx;
			line-height: 26rpx;
		}
	}

	.avatar {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		border: 2rpx solid rgba(240, 215, 154, 0.55);
	}

	.avatar-guest {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 248, 232, 0.14);
		border-style: dashed;
	}

	.hero-t {
		margin-top: 54rpx;
	}

	.hero-t1 {
		font-size: 76rpx;
		font-weight: 800;
		color: #FFF6E6;
		letter-spacing: 8rpx;
		line-height: 1.1;
		text-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.3);
	}

	.hero-t2 {
		margin-top: 12rpx;
		font-size: 28rpx;
		color: rgba(240, 215, 154, 0.9);
		letter-spacing: 4rpx;
	}

	.hero-chip {
		margin-top: 26rpx;
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		height: 48rpx;
		padding: 0 18rpx;
		border-radius: $bl-r-pill;
		background: rgba(0, 0, 0, 0.22);
		border: 1rpx solid rgba(240, 215, 154, 0.28);
	}

	.hero-chip-t {
		margin-left: 8rpx;
		font-size: 22rpx;
		color: rgba(255, 246, 230, 0.82);
	}

	/* ============ 兑奖入口 ============ */
	.entry {
		margin-top: -84rpx;
		position: relative;
		z-index: 5;
		background: $bl-card;
		border-radius: $bl-r-xl;
		padding: 28rpx;
		box-shadow: 0 20rpx 48rpx rgba(14, 59, 46, 0.14);
		border: 1rpx solid rgba(240, 215, 154, 0.5);
	}

	.entry-top {
		display: flex;
	}

	.entry-img {
		width: 148rpx;
		height: 148rpx;
		border-radius: $bl-r-md;
		flex-shrink: 0;
		background: #F4F2EC;
	}

	.entry-txt {
		flex: 1;
		margin-left: 24rpx;
		min-width: 0;
	}

	.entry-t1 {
		font-size: 34rpx;
		font-weight: 800;
		color: $bl-ink;
		letter-spacing: 1rpx;
	}

	.entry-t2 {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: $bl-ink-3;
	}

	.entry-tags {
		margin-top: 18rpx;
		display: flex;

		text {
			margin-right: 12rpx;
		}
	}

	.entry-btn {
		margin-top: 26rpx;
	}

	.entry-btn-t {
		margin-left: 12rpx;
		font-size: 34rpx;
		font-weight: 800;
		letter-spacing: 4rpx;
	}

	.entry-tip {
		margin-top: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.entry-tip-t {
		margin-left: 8rpx;
		font-size: 22rpx;
		color: $bl-ink-3;
	}

	.entry-num {
		color: $bl-red;
		font-weight: 800;
		font-size: 26rpx;
	}

	/* ============ 播报 ============ */
	.marquee {
		margin-top: 24rpx;
		height: 68rpx;
		background: $bl-gold-lt;
		border: 1rpx solid rgba(184, 137, 43, 0.2);
		border-radius: $bl-r-sm;
		display: flex;
		align-items: center;
		padding: 0 18rpx;
		overflow: hidden;
	}

	.marquee-box {
		flex: 1;
		margin-left: 12rpx;
		overflow: hidden;
		height: 68rpx;
		position: relative;
	}

	.marquee-in {
		position: absolute;
		white-space: nowrap;
		line-height: 68rpx;
		animation: mq linear infinite;
	}

	@keyframes mq {
		from { transform: translateX(0); }
		to { transform: translateX(-50%); }
	}

	.marquee-t {
		font-size: 22rpx;
		color: #8A6520;
	}

	/* ============ 概览 ============ */
	.guest {
		margin-top: 24rpx;
		padding: 24rpx 26rpx;
		display: flex;
		align-items: center;
	}

	.guest-ico {
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: $bl-gold-lt;
		border: 1rpx solid rgba(184, 137, 43, 0.22);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.guest-txt {
		flex: 1;
		min-width: 0;
		margin-left: 20rpx;
		display: flex;
		flex-direction: column;
	}

	.guest-t {
		font-size: $bl-fs-sm;
		font-weight: 700;
		color: $bl-ink;
	}

	.guest-d {
		margin-top: 6rpx;
		font-size: $bl-fs-tiny;
		color: $bl-ink-3;
	}

	.guest-btn {
		flex-shrink: 0;
		margin-left: 18rpx;
		height: 60rpx;
		padding: 0 30rpx;
		border-radius: 30rpx;
		background: $bl-green;
		color: #FFF8E8;
		font-size: 25rpx;
		font-weight: 700;
		letter-spacing: 2rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat {
		margin-top: 24rpx;
		background: $bl-card;
		border-radius: $bl-r-lg;
		border: 1rpx solid rgba(230, 225, 212, 0.9);
		box-shadow: $bl-sd-sm;
		display: flex;
		align-items: center;
		padding: 26rpx 0;
	}

	.stat-i {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-n {
		font-size: 46rpx;
		color: $bl-green;
	}

	.stat-l {
		margin-top: 4rpx;
		font-size: 22rpx;
		color: $bl-ink-3;
	}

	.stat-x {
		width: 1rpx;
		height: 48rpx;
		background: $bl-line;
	}

	/* ============ 流程 ============ */
	.flow {
		padding: 30rpx 28rpx 10rpx;
	}

	.flow-i {
		display: flex;
	}

	.flow-l {
		width: 68rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.flow-dot {
		width: 68rpx;
		height: 68rpx;
		border-radius: 50%;
		background: $bl-green-lt;
		border: 1rpx solid rgba(44, 114, 86, 0.18);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.flow-line {
		flex: 1;
		width: 2rpx;
		background: linear-gradient(180deg, rgba(44, 114, 86, 0.25), rgba(44, 114, 86, 0.06));
		margin: 6rpx 0;
	}

	.flow-r {
		flex: 1;
		margin-left: 22rpx;
		padding-bottom: 30rpx;
	}

	.flow-t {
		display: flex;
		align-items: baseline;
	}

	.flow-no {
		font-size: 22rpx;
		color: $bl-gold;
		font-weight: 800;
		letter-spacing: 1rpx;
		margin-right: 12rpx;
	}

	.flow-t1 {
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.flow-d {
		display: block;
		margin-top: 6rpx;
		font-size: 24rpx;
		color: $bl-ink-3;
		line-height: 1.6;
	}

	/* ============ 奖品 ============ */
	.prz {
		width: 100%;
		white-space: nowrap;
	}

	.prz-row {
		display: flex;
		padding-bottom: 8rpx;
	}

	.prz-i {
		width: 240rpx;
		margin-right: 20rpx;
		background: $bl-card;
		border-radius: $bl-r-lg;
		overflow: hidden;
		border: 1rpx solid rgba(230, 225, 212, 0.9);
		box-shadow: $bl-sd-sm;
		position: relative;
		flex-shrink: 0;
	}

	.prz-img {
		width: 240rpx;
		height: 200rpx;
	}

	.prz-tag {
		position: absolute;
		left: 0;
		top: 16rpx;
		height: 34rpx;
		padding: 0 14rpx 0 12rpx;
		border-radius: 0 17rpx 17rpx 0;
		display: flex;
		align-items: center;

		text {
			color: #fff;
			font-size: 18rpx;
			font-weight: 600;
			letter-spacing: 1rpx;
		}
	}

	.prz-b {
		padding: 16rpx 18rpx 20rpx;
	}

	.prz-n {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.prz-v {
		margin-top: 8rpx;
		display: flex;
		align-items: baseline;
	}

	.prz-v1 {
		font-size: 20rpx;
		color: $bl-ink-4;
		margin-right: 6rpx;
	}

	.prz-v2 {
		font-size: 28rpx;
		color: $bl-red;
	}

	/* ============ 门店 ============ */
	.st-list {
		display: flex;
		flex-direction: column;
	}

	.st-i {
		display: flex;
		padding: 20rpx;
		margin-bottom: 18rpx;
	}

	.st-img {
		width: 160rpx;
		height: 120rpx;
		border-radius: $bl-r-sm;
		flex-shrink: 0;
	}

	.st-txt {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.st-n {
		display: block;
		font-size: 28rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.st-r {
		display: flex;
		align-items: center;
		margin-top: 6rpx;
	}

	.st-a {
		margin-left: 6rpx;
		font-size: 22rpx;
		color: $bl-ink-3;
		flex: 1;
	}

	.st-d {
		margin-left: auto;
		font-size: 24rpx;
		color: $bl-gold;
	}

	/* ============ 关于 ============ */
	.about {
		overflow: hidden;
	}

	.about-imgs {
		display: flex;
		gap: 12rpx;
		padding: 18rpx 18rpx 0;
	}

	.about-product {
		flex: 1;
		min-width: 0;
		padding: 10rpx 8rpx 14rpx;
		border-radius: 16rpx;
		background: #F6F4EE;
		text-align: center;
	}

	.about-img {
		width: 100%;
		height: 210rpx;
		display: block;
	}

	.about-price,
	.about-weight {
		display: block;
	}

	.about-price {
		margin-top: 8rpx;
		font-size: 25rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.about-weight {
		margin-top: 2rpx;
		font-size: 19rpx;
		color: $bl-ink-3;
	}

	.about-txt {
		padding: 24rpx 28rpx 28rpx;
	}

	.about-t {
		display: block;
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.about-d {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: $bl-ink-3;
		line-height: 1.7;
	}

	/* ============ 门店端入口 ============ */
	.ent-store {
		margin-top: 32rpx;
		padding: 24rpx 26rpx;
		border-radius: $bl-r-lg;
		background: linear-gradient(120deg, #14332A 0%, #0B241C 100%);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.ent-sales {
		margin-top: 16rpx;
		background: $bl-card;
		border: 1rpx solid rgba(184, 137, 43, 0.3);
		box-shadow: $bl-sd-sm;
	}

	.ent-sales-ico {
		background: $bl-gold-lt;
		border-color: rgba(184, 137, 43, 0.22);
	}

	.ent-sales-t { color: $bl-ink; }
	.ent-sales-d { color: $bl-ink-3; }

	.ent-store-l {
		display: flex;
		align-items: center;
	}

	.ent-store-ico {
		width: 72rpx;
		height: 72rpx;
		border-radius: $bl-r-sm;
		background: rgba(240, 215, 154, 0.12);
		border: 1rpx solid rgba(240, 215, 154, 0.24);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
	}

	.ent-store-t {
		font-size: 28rpx;
		font-weight: 700;
		color: #FFF3DA;
	}

	.ent-store-d {
		margin-top: 4rpx;
		font-size: 21rpx;
		color: rgba(255, 243, 218, 0.55);
	}

	.foot {
		margin-top: 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.foot-t {
		font-size: 22rpx;
		color: $bl-ink-4;
		letter-spacing: 1rpx;
	}

	.foot-d {
		margin-top: 6rpx;
		font-size: 20rpx;
		color: #C3CCC6;
	}

	/* ============ 公告弹窗 ============ */
	.nt {
		width: 600rpx;
		background: $bl-card;
		border-radius: $bl-r-xl;
		overflow: hidden;
	}

	.nt-head {
		position: relative;
		height: 240rpx;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		padding: 0 32rpx 26rpx;
	}

	.nt-bg {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.nt-head-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(180deg, rgba(10, 43, 33, 0.35), rgba(10, 43, 33, 0.9));
	}

	.nt-badge {
		position: absolute;
		left: 32rpx;
		top: 28rpx;
		height: 38rpx;
		padding: 0 16rpx;
		border-radius: 6rpx;
		background: $bl-red;
		display: flex;
		align-items: center;

		text {
			color: #FFF0DC;
			font-size: 20rpx;
			font-weight: 700;
			letter-spacing: 2rpx;
		}
	}

	.nt-t {
		position: relative;
		z-index: 2;
		font-size: 38rpx;
		font-weight: 800;
		color: #FFF6E6;
		letter-spacing: 2rpx;
	}

	.nt-d {
		position: relative;
		z-index: 2;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: rgba(240, 215, 154, 0.8);
	}

	.nt-body {
		padding: 30rpx 32rpx 32rpx;
	}

	.nt-li {
		display: flex;
		margin-bottom: 18rpx;
	}

	.nt-li-dot {
		width: 10rpx;
		height: 10rpx;
		border-radius: 50%;
		background: $bl-gold;
		margin-top: 16rpx;
		margin-right: 14rpx;
		flex-shrink: 0;
	}

	.nt-li-t {
		flex: 1;
		font-size: 25rpx;
		color: $bl-ink-2;
		line-height: 1.7;
	}

	.nt-btn {
		margin-top: 20rpx;
	}
</style>
