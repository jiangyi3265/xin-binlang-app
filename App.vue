<script>
	import store from './store/index.js'
	import salesStore from './store/sales.js'
	import { clearCustomerSession, installAuthorizationInterceptors } from './utils/api.js'

	export default {
		onLaunch() {
			// 启动即进首页，不做任何登录跳转：微信要求用户先浏览体验功能服务，
			// 再自行选择是否授权登录。登录只在用户主动兑奖 / 查看个人数据时触发。
			clearCustomerSession()
			store.boot()
			salesStore.boot()
			installAuthorizationInterceptors(() => store.isStoreAuthenticated(), () => salesStore.authenticated())
		},
		onShow() {
			store.tickExpire()
			store.syncActive().catch(() => {})
		},
		onHide() {}
	}
</script>

<style lang="scss">
	/* ============================================================
	   全局基础样式 —— 金榔记 · 开码有奖
	   ============================================================ */
	page {
		background: $bl-paper;
		color: $bl-ink;
		font-size: $bl-fs-body;
		line-height: 1.6;
		font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue",
			"Hiragino Sans GB", "Microsoft YaHei", sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	view,
	text,
	scroll-view,
	image,
	input,
	button {
		box-sizing: border-box;
	}

	image {
		display: block;
	}

	/* 去掉 button 默认样式 */
	button {
		padding: 0;
		margin: 0;
		background: transparent;
		font-size: inherit;
		line-height: inherit;
		border-radius: 0;

		&::after {
			border: none;
		}
	}

	/* ============ 版心 ============ */
	.bl-page {
		min-height: 100vh;
		padding-bottom: calc(48rpx + constant(safe-area-inset-bottom));
		padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
	}

	.bl-wrap {
		padding-left: $bl-pad;
		padding-right: $bl-pad;
	}

	/* 宣纸纹理：极细的斜向纹 + 颗粒感，靠渐变实现，不用图片 */
	.bl-paper-tex {
		background-color: $bl-paper;
		background-image:
			repeating-linear-gradient(45deg,
				rgba(184, 137, 43, 0.028) 0,
				rgba(184, 137, 43, 0.028) 1rpx,
				transparent 1rpx,
				transparent 9rpx),
			repeating-linear-gradient(-45deg,
				rgba(14, 59, 46, 0.022) 0,
				rgba(14, 59, 46, 0.022) 1rpx,
				transparent 1rpx,
				transparent 11rpx);
	}

	/* ============ 卡片 ============ */
	.bl-card {
		background: $bl-card;
		border-radius: $bl-r-lg;
		box-shadow: $bl-sd-sm;
		border: 1rpx solid rgba(230, 225, 212, 0.9);
	}

	.bl-card-pad {
		padding: 28rpx 28rpx;
	}

	/* ============ 通用文字 ============ */
	.bl-h1 {
		font-size: $bl-fs-h1;
		font-weight: 800;
		letter-spacing: 1rpx;
		color: $bl-ink;
	}

	.bl-h2 {
		font-size: $bl-fs-h2;
		font-weight: 700;
		color: $bl-ink;
	}

	.bl-h3 {
		font-size: $bl-fs-h3;
		font-weight: 700;
		color: $bl-ink;
	}

	.bl-t {
		font-size: $bl-fs-body;
		color: $bl-ink;
	}

	.bl-t2 {
		font-size: $bl-fs-sm;
		color: $bl-ink-2;
	}

	.bl-t3 {
		font-size: $bl-fs-xs;
		color: $bl-ink-3;
	}

	.bl-num {
		font-family: "DIN Alternate", "Bebas Neue", "Helvetica Neue", Helvetica, sans-serif;
		font-weight: 700;
		letter-spacing: 1rpx;
	}

	.bl-ellipsis {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.bl-ellipsis-2 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	/* ============ 区块标题（左侧金色竖条 + 中文标题 + 英文副标） ============ */
	.bl-sec {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin: 40rpx 0 22rpx;
	}

	.bl-sec-l {
		display: flex;
		align-items: center;
	}

	.bl-sec-bar {
		width: 6rpx;
		height: 30rpx;
		border-radius: 4rpx;
		background: linear-gradient(180deg, $bl-gold-2, $bl-gold);
		margin-right: 16rpx;
	}

	.bl-sec-t {
		font-size: $bl-fs-h3;
		font-weight: 800;
		color: $bl-ink;
		letter-spacing: 1rpx;
	}

	.bl-sec-sub {
		font-size: $bl-fs-tiny;
		color: $bl-ink-4;
		margin-left: 14rpx;
		text-transform: uppercase;
		letter-spacing: 2rpx;
	}

	.bl-sec-more {
		display: flex;
		align-items: center;
		font-size: $bl-fs-xs;
		color: $bl-ink-3;
	}

	/* ============ 行 ============ */
	.bl-row {
		display: flex;
		align-items: center;
	}

	.bl-row-b {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.bl-flex1 {
		flex: 1;
		min-width: 0;
	}

	/* ============ 标签 ============ */
	.bl-tag {
		display: inline-flex;
		align-items: center;
		height: 36rpx;
		padding: 0 14rpx;
		border-radius: $bl-r-xs;
		font-size: $bl-fs-tiny;
		font-weight: 600;
		line-height: 1;
	}

	.bl-tag-gold {
		color: $bl-gold;
		background: $bl-gold-lt;
		border: 1rpx solid rgba(184, 137, 43, 0.28);
	}

	.bl-tag-green {
		color: $bl-ok;
		background: $bl-green-lt;
		border: 1rpx solid rgba(44, 114, 86, 0.22);
	}

	.bl-tag-red {
		color: $bl-red;
		background: $bl-red-lt;
		border: 1rpx solid rgba(192, 57, 43, 0.22);
	}

	.bl-tag-gray {
		color: $bl-ink-3;
		background: #F2F1EC;
		border: 1rpx solid $bl-line;
	}

	.bl-tag-blue {
		color: $bl-blue;
		background: $bl-blue-lt;
		border: 1rpx solid rgba(47, 109, 140, 0.22);
	}

	/* ============ 按钮 ============ */
	.bl-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 96rpx;
		border-radius: $bl-r-md;
		font-size: 32rpx;
		font-weight: 700;
		letter-spacing: 2rpx;
		transition: transform 0.12s ease, opacity 0.12s ease;
	}

	.bl-btn:active {
		transform: scale(0.985);
		opacity: 0.92;
	}

	.bl-btn-primary {
		color: #FFF7E4;
		background: linear-gradient(135deg, $bl-green-2 0%, $bl-green 62%, $bl-green-ink 100%);
		box-shadow: $bl-sd-green;
	}

	.bl-btn-gold {
		color: #3B2A06;
		background: linear-gradient(135deg, #F3D689 0%, $bl-gold-2 46%, $bl-gold 100%);
		box-shadow: $bl-sd-gold;
	}

	.bl-btn-ghost {
		color: $bl-green;
		background: transparent;
		border: 2rpx solid rgba(14, 59, 46, 0.24);
	}

	.bl-btn-line {
		color: $bl-ink-2;
		background: $bl-card;
		border: 1rpx solid $bl-line;
	}

	.bl-btn-disabled {
		color: #FFFFFF;
		background: #C6CDC8;
		box-shadow: none;
	}

	.bl-btn-sm {
		height: 64rpx;
		font-size: $bl-fs-sm;
		border-radius: $bl-r-sm;
		padding: 0 26rpx;
		font-weight: 600;
		letter-spacing: 0;
	}

	/* ============ 分隔 ============ */
	.bl-hr {
		height: 1rpx;
		background: $bl-line;
	}

	/* 中式双线分隔 */
	.bl-hr-x {
		height: 5rpx;
		border-top: 1rpx solid rgba(184, 137, 43, 0.4);
		border-bottom: 1rpx solid rgba(184, 137, 43, 0.18);
	}

	/* 虚线（票券撕口） */
	.bl-dash {
		height: 1rpx;
		background-image: linear-gradient(90deg, $bl-line 0 12rpx, transparent 12rpx 24rpx);
		background-size: 24rpx 1rpx;
		background-repeat: repeat-x;
	}

	/* ============ 遮罩 & 弹层 ============ */
	.bl-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: $bl-mask;
		z-index: 900;
	}

	/* ============ 列表项 ============ */
	.bl-cell {
		display: flex;
		align-items: center;
		min-height: 104rpx;
		padding: 0 28rpx;
		background: $bl-card;
	}

	.bl-cell-t {
		flex: 1;
		font-size: $bl-fs-body;
		color: $bl-ink;
		margin-left: 20rpx;
	}

	.bl-cell-v {
		font-size: $bl-fs-sm;
		color: $bl-ink-3;
		margin-right: 8rpx;
	}

	/* ============ 键值行 ============ */
	.bl-kv {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 16rpx 0;
	}

	.bl-kv-k {
		font-size: $bl-fs-sm;
		color: $bl-ink-3;
		flex-shrink: 0;
	}

	.bl-kv-v {
		font-size: $bl-fs-sm;
		color: $bl-ink;
		text-align: right;
		margin-left: 32rpx;
		flex: 1;
		font-weight: 500;
	}

	/* ============ 骨架/空态 ============ */
	.bl-empty {
		padding: 120rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.bl-empty-t {
		font-size: $bl-fs-sm;
		color: $bl-ink-4;
		margin-top: 24rpx;
	}

	/* ============ 底部占位（自定义底栏页面用） ============ */
	.bl-safe-b {
		height: constant(safe-area-inset-bottom);
		height: env(safe-area-inset-bottom);
	}
</style>
