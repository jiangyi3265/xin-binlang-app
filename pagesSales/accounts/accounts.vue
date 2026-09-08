<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="门店账号" bg="paper" home="/pagesSales/stores/stores" />
		<view class="bl-wrap body">
			<view class="store-head"><text>{{ storeInfo.short || '门店账号' }}</text><text>{{ list.length }} 个账号</text></view>
			<view class="scope"><bl-icon name="lock" :size="25" color="#2C7256" :weight="1.9" /><text>只能管理本人创建门店的账号，建议每店至少创建一个店主。</text></view>
			<view v-for="item in list" :key="item.id" class="account bl-card">
				<view class="avatar"><text>{{ (item.name || '店').slice(0,1) }}</text></view>
				<view class="account-main"><view><text class="account-name">{{ item.name }}</text><text class="bl-tag" :class="item.role === 'owner' ? 'bl-tag-gold' : 'bl-tag-green'">{{ item.role === 'owner' ? '店主' : '店员' }}</text></view><text class="username">账号：{{ item.username }}</text><text class="phone">{{ item.phone || '未填写联系电话' }}</text></view>
				<text class="state" :class="{ off: !item.active }">{{ item.active ? '启用' : '停用' }}</text>
			</view>
			<view class="form bl-card">
				<text class="form-title">创建门店登录账号</text>
				<view class="roles"><view :class="{ active: form.role === 'owner' }" @tap="form.role='owner'"><text>店主</text><text>查看本店数据、管理员工</text></view><view :class="{ active: form.role === 'staff' }" @tap="form.role='staff'"><text>店员</text><text>仅扫码或输码核销</text></view></view>
				<input v-model="form.name" placeholder="人员姓名" maxlength="80" />
				<input v-model="form.username" placeholder="登录账号（平台内不可重复）" maxlength="80" />
				<input v-model="form.phone" type="tel" placeholder="联系电话（选填）" maxlength="30" />
				<input v-model="form.password" password placeholder="初始密码，至少 8 位" maxlength="128" />
				<view class="bl-btn bl-btn-primary create" :class="{ 'bl-btn-disabled': saving }" @tap="create"><text>{{ saving ? '正在创建…' : '创建账号' }}</text></view>
			</view>
		</view>
	</view>
</template>

<script>
	import salesStore from '@/store/sales.js'
	const emptyForm = () => ({ role: 'owner', name: '', username: '', phone: '', password: '' })
	export default {
		data() { return { id: '', list: [], saving: false, form: emptyForm() } },
		computed: { storeInfo() { return salesStore.store(this.id) || {} } },
		onLoad(query) { this.id = query.id || ''; this.load() },
		onShow() { if (!salesStore.authenticated()) uni.redirectTo({ url: '/pagesSales/login/login' }) },
		methods: {
			async load() { if (!this.id) return; try { if (!salesStore.store(this.id)) await salesStore.loadStores(); this.list = await salesStore.accounts(this.id) } catch (error) { uni.showToast({ title: error.message || '账号读取失败', icon: 'none' }) } },
			async create() {
				if (this.saving) return
				if (!this.form.name.trim() || !this.form.username.trim() || this.form.password.length < 8) { uni.showToast({ title: '请完整填写，密码至少 8 位', icon: 'none' }); return }
				this.saving = true
				try { await salesStore.createAccount(this.id, this.form); this.form = emptyForm(); await this.load(); uni.showToast({ title: '门店账号已创建', icon: 'success' }) }
				catch (error) { uni.showToast({ title: error.message || '创建失败', icon: 'none' }) }
				finally { this.saving = false }
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg{min-height:100vh;padding-bottom:60rpx}.body{padding-top:22rpx}.store-head{display:flex;align-items:flex-end;justify-content:space-between}.store-head text:first-child{font-size:33rpx;font-weight:800;color:$bl-ink}.store-head text:last-child{font-size:21rpx;color:$bl-ink-3}.scope{display:flex;align-items:flex-start;gap:8rpx;margin-top:14rpx;padding:17rpx 18rpx;background:$bl-green-lt;border-radius:$bl-r-sm;color:$bl-green-2;font-size:21rpx}.account{display:flex;align-items:center;margin-top:16rpx;padding:22rpx}.avatar{width:72rpx;height:72rpx;display:grid;place-items:center;flex-shrink:0;border-radius:$bl-r-md;background:$bl-gold-lt;color:$bl-gold;font-size:29rpx;font-weight:800}.account-main{flex:1;min-width:0;margin-left:16rpx}.account-main>view{display:flex;align-items:center;gap:10rpx}.account-name{font-size:27rpx;font-weight:750;color:$bl-ink}.username,.phone{display:block;color:$bl-ink-3;font-size:20rpx}.state{font-size:20rpx;color:$bl-ok}.state.off{color:$bl-ink-4}.form{margin-top:28rpx;padding:25rpx}.form-title{display:block;font-size:29rpx;font-weight:800;color:$bl-ink}.roles{display:grid;grid-template-columns:1fr 1fr;gap:12rpx;margin-top:18rpx}.roles view{padding:16rpx;border:1rpx solid $bl-line;border-radius:$bl-r-sm;background:$bl-paper-2}.roles view.active{border-color:$bl-green;background:$bl-green-lt}.roles text:first-child{display:block;font-size:24rpx;font-weight:700;color:$bl-ink}.roles text:last-child{display:block;font-size:18rpx;color:$bl-ink-3}.form>input{height:82rpx;margin-top:14rpx;padding:0 20rpx;border:1rpx solid $bl-line;border-radius:$bl-r-sm;background:$bl-paper-2;font-size:24rpx}.create{height:84rpx;margin-top:20rpx;font-size:28rpx}
</style>
