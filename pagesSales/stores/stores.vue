<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="我的门店" bg="green" :show-back="false">
			<template #right><view class="logout" @tap="logout"><text>退出</text></view></template>
		</bl-navbar>
		<view class="hero">
			<view><text class="hello">{{ user.name }}</text><text class="scope">公司销售 · 仅查看本人门店</text></view>
			<view class="count"><text>{{ list.length }}</text><text>门店</text></view>
		</view>
		<view class="bl-wrap body">
			<view class="notice"><bl-icon name="lock" :size="26" color="#4376AB" :weight="1.9" /><text>其他销售创建的门店在服务端已隔离，不会出现在这里。</text></view>
			<view class="add bl-btn bl-btn-primary" @tap="createStore"><bl-icon name="plus" :size="30" color="#FFF7E4" :weight="2.2" /><text>新增合作门店</text></view>
			<bl-empty v-if="!loading && !list.length" icon="store" text="还没有创建门店" sub="点击上方按钮录入第一家合作门店" />
			<view v-for="item in list" :key="item.id" class="store bl-card">
				<view class="store-head">
					<view class="store-title"><text class="name">{{ item.short }}</text><text class="id">{{ item.id }}</text></view>
					<text class="bl-tag" :class="item.status === 'active' ? 'bl-tag-green' : 'bl-tag-gray'">{{ item.status === 'active' ? '启用' : '停用' }}</text>
				</view>
				<view class="address"><bl-icon name="map-pin" :size="25" color="#60768C" :weight="1.8" /><text>{{ item.addr }}</text></view>
				<view class="metrics">
					<view><text>{{ item.accountCount }}</text><text>门店账号</text></view>
					<view><text>{{ item.redemptionCount }}</text><text>关联兑奖</text></view>
					<view><text>{{ item.verifiedCount }}</text><text>已核销</text></view>
				</view>
				<view class="actions">
					<view @tap="accounts(item)"><bl-icon name="users" :size="24" color="#102E53" :weight="1.9" /><text>账号</text></view>
					<view @tap="edit(item)"><bl-icon name="edit" :size="24" color="#102E53" :weight="1.9" /><text>编辑</text></view>
					<view class="danger" @tap="remove(item)"><bl-icon name="trash" :size="24" color="#C0392B" :weight="1.9" /><text>删除</text></view>
				</view>
			</view>
			<view v-if="loading" class="loading"><text>正在读取门店…</text></view>
		</view>
	</view>
</template>

<script>
	import salesStore from '@/store/sales.js'
	export default {
		data() { return { loading: false, tick: 0 } },
		computed: { user() { return salesStore.state.user || {} }, list() { this.tick; return salesStore.state.stores } },
		onShow() {
			if (!salesStore.authenticated()) { uni.redirectTo({ url: '/pagesSales/login/login' }); return }
			this.refresh()
		},
		methods: {
			async refresh() { this.loading = true; try { await salesStore.loadStores(); this.tick++ } catch (error) { uni.showToast({ title: error.message, icon: 'none' }) } finally { this.loading = false } },
			createStore() { uni.navigateTo({ url: '/pagesSales/store/edit' }) },
			edit(item) { uni.navigateTo({ url: '/pagesSales/store/edit?id=' + item.id }) },
			accounts(item) { uni.navigateTo({ url: '/pagesSales/accounts/accounts?id=' + item.id }) },
			remove(item) {
				uni.showModal({ title: '删除门店', content: `确认删除“${item.short}”吗？存在兑奖记录时系统会阻止删除。`, confirmColor: '#C0392B', success: async result => {
					if (!result.confirm) return
					try { await salesStore.deleteStore(item.id); this.tick++; uni.showToast({ title: '门店已删除', icon: 'success' }) } catch (error) { uni.showToast({ title: error.message || '删除失败', icon: 'none' }) }
				} })
			},
			logout() { salesStore.logout(); uni.reLaunch({ url: '/pages/index/index' }) }
		}
	}
</script>

<style lang="scss" scoped>
	.pg{min-height:100vh;padding-bottom:50rpx}.logout{padding:10rpx 18rpx;color:#F5F9FD;font-size:22rpx}.hero{padding:24rpx $bl-pad 30rpx;background:$bl-green;display:flex;align-items:center;justify-content:space-between;color:#F5F9FD}.hello{display:block;font-size:36rpx;font-weight:800}.scope{display:block;margin-top:4rpx;color:rgba(255,246,230,.6);font-size:21rpx}.count{text-align:right}.count text:first-child{display:block;font-size:42rpx;font-weight:800;color:$bl-gold-3}.count text:last-child{font-size:20rpx;color:rgba(255,246,230,.58)}.body{padding-top:24rpx}.notice{display:flex;align-items:flex-start;gap:10rpx;padding:18rpx 20rpx;border-radius:$bl-r-sm;background:$bl-green-lt;color:$bl-green-2;font-size:21rpx}.add{height:84rpx;margin-top:18rpx;gap:10rpx;font-size:27rpx}.store{margin-top:20rpx;padding:24rpx}.store-head{display:flex;align-items:flex-start;justify-content:space-between}.name{display:block;font-size:31rpx;font-weight:800;color:$bl-ink}.id{display:block;margin-top:2rpx;color:$bl-ink-4;font-size:20rpx}.address{display:flex;align-items:flex-start;gap:8rpx;margin-top:15rpx;color:$bl-ink-2;font-size:23rpx}.address text{flex:1}.metrics{display:grid;grid-template-columns:repeat(3,1fr);margin-top:22rpx;padding:18rpx 0;background:$bl-paper-2;border-radius:$bl-r-sm}.metrics view{text-align:center;border-right:1rpx solid $bl-line}.metrics view:last-child{border-right:0}.metrics text:first-child{display:block;color:$bl-green;font-size:30rpx;font-weight:800}.metrics text:last-child{font-size:19rpx;color:$bl-ink-3}.actions{display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx;margin-top:18rpx}.actions view{height:62rpx;display:flex;align-items:center;justify-content:center;gap:7rpx;border:1rpx solid $bl-line;border-radius:$bl-r-sm;color:$bl-green;font-size:22rpx}.actions .danger{color:$bl-red}.loading{text-align:center;padding:60rpx;color:$bl-ink-3;font-size:23rpx}
</style>
