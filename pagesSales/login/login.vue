<template>
	<view class="pg">
		<image class="bg" :src="cfg.homeBg" mode="aspectFill" />
		<view class="mask"></view>
		<bl-navbar bg="transparent" title="" :fixed="false" home="/pages/index/index" />
		<view class="wrap">
			<view class="identity">
				<image v-if="cfg.brandLogo" class="logo" :src="cfg.brandLogo" mode="aspectFill" />
				<view v-else class="logo logo-text"><text>{{ cfg.brandMark }}</text></view>
				<text class="eyebrow">SALES NETWORK</text>
				<text class="title">公司销售工作台</text>
				<text class="sub">门店拓展、资料维护与门店账号开通</text>
			</view>
			<view class="card">
				<view class="scope">
					<bl-icon name="lock" :size="28" color="#4376AB" :weight="1.9" />
					<text>登录后仅显示由当前销售创建的门店</text>
				</view>
				<input v-model="username" class="input" placeholder="销售登录账号" maxlength="80" />
				<input v-model="password" class="input" password placeholder="登录密码" maxlength="128" @confirm="login" />
				<view class="bl-btn bl-btn-primary submit" :class="{ 'bl-btn-disabled': loading }" @tap="login">
					<text>{{ loading ? '正在登录…' : '销售账号登录' }}</text>
				</view>
				<view class="hint"><text>销售账号由总部超级管理员在“销售账号”中创建</text></view>
			</view>
			<view class="switch" @tap="toStore"><text>我是门店人员，前往门店核销登录</text></view>
		</view>
	</view>
</template>

<script>
	import customerStore from '@/store/index.js'
	import salesStore from '@/store/sales.js'

	export default {
		data() { return { username: '', password: '', loading: false } },
		computed: { cfg() { return customerStore.state.config } },
		onShow() {
			if (salesStore.authenticated()) uni.redirectTo({ url: '/pagesSales/stores/stores' })
		},
		methods: {
			async login() {
				if (this.loading) return
				if (!this.username.trim() || !this.password) { uni.showToast({ title: '请输入账号和密码', icon: 'none' }); return }
				this.loading = true
				try {
					const user = await salesStore.login(this.username.trim(), this.password)
					uni.showToast({ title: user.name + '，登录成功', icon: 'none' })
					setTimeout(() => uni.redirectTo({ url: '/pagesSales/stores/stores' }), 350)
				} catch (error) {
					uni.showToast({ title: error.message || '登录失败', icon: 'none' })
				} finally { this.loading = false }
			},
			toStore() { uni.redirectTo({ url: '/pagesStore/login/login' }) }
		}
	}
</script>

<style lang="scss" scoped>
	.pg{min-height:100vh;position:relative;background:$bl-green-ink}.bg{position:absolute;inset:0;width:100%;height:100%}.mask{position:absolute;inset:0;background:linear-gradient(178deg,rgba(8,39,29,.9),rgba(6,25,19,.98))}.wrap{position:relative;z-index:2;padding:10rpx $bl-pad 60rpx}.identity{display:flex;flex-direction:column;align-items:center;padding:12rpx 0 38rpx}.logo{width:88rpx;height:88rpx;border-radius:$bl-r-md;border:1rpx solid rgba(240,215,154,.45)}.logo-text{display:grid;place-items:center;background:$bl-red;color:#EDF4FC;font-size:42rpx;font-weight:800}.eyebrow{margin-top:22rpx;color:$bl-gold-3;font-size:19rpx;letter-spacing:5rpx}.title{margin-top:8rpx;color:#F5F9FD;font-size:46rpx;font-weight:800;letter-spacing:3rpx}.sub{margin-top:8rpx;color:rgba(255,246,230,.6);font-size:22rpx}.card{padding:30rpx 26rpx;background:$bl-card;border-radius:$bl-r-xl;box-shadow:0 24rpx 64rpx rgba(0,0,0,.32)}.scope{display:flex;align-items:center;gap:10rpx;padding:18rpx;background:$bl-green-lt;border-radius:$bl-r-sm;color:$bl-green-2;font-size:22rpx}.input{height:88rpx;margin-top:16rpx;padding:0 22rpx;border:1rpx solid $bl-line;border-radius:$bl-r-sm;background:$bl-paper-2;font-size:26rpx}.submit{margin-top:22rpx}.hint{padding-top:20rpx;text-align:center;color:$bl-ink-3;font-size:20rpx}.switch{padding:34rpx 0;text-align:center;color:rgba(255,246,230,.72);font-size:23rpx}
</style>
