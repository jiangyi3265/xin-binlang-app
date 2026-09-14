<template>
	<view class="pg bl-paper-tex">
		<bl-navbar :title="id ? '编辑门店' : '新增门店'" bg="paper" home="/pagesSales/stores/stores" />
		<view class="bl-wrap body">
			<view class="intro">
				<text>{{ id ? '修改本人创建的门店资料' : '录入新的合作核销门店' }}</text>
				<text>保存后可继续创建店主或店员账号</text>
			</view>
			<view class="form bl-card">
				<label><text>门店全称</text><input v-model="form.name" placeholder="例如：倌榔雨花亭旗舰店" maxlength="120" /></label>
				<label><text>门店简称</text><input v-model="form.short" placeholder="例如：雨花亭旗舰店" maxlength="80" /></label>
				<label><text>详细地址</text><textarea v-model="form.addr" placeholder="省市区、街道、门牌号及楼层" maxlength="300" /></label>
				<view class="map-btn" @tap="chooseLocation"><bl-icon name="map-pin" :size="28" color="#102E53" :weight="1.9" /><text>从微信地图选择位置</text></view>
				<view class="coords">
					<label><text>纬度</text><input v-model="form.latitude" type="digit" placeholder="28.000000" /></label>
					<label><text>经度</text><input v-model="form.longitude" type="digit" placeholder="113.000000" /></label>
				</view>
				<label><text>联系电话</text><input v-model="form.phone" type="tel" placeholder="门店联系电话" maxlength="40" /></label>
				<label><text>营业时间</text><input v-model="form.hours" placeholder="例如：09:00 - 22:00" maxlength="80" /></label>
				<view class="status"><view><text>门店状态</text><text>{{ form.status === 'active' ? '启用后可供顾客选择' : '停用后不在小程序展示' }}</text></view><switch color="#102E53" :checked="form.status === 'active'" @change="form.status=$event.detail.value?'active':'disabled'" /></view>
			</view>
			<view class="bl-btn bl-btn-primary save" :class="{ 'bl-btn-disabled': saving }" @tap="save"><text>{{ saving ? '正在保存…' : '保存门店资料' }}</text></view>
		</view>
	</view>
</template>

<script>
	import salesStore from '@/store/sales.js'
	const emptyForm = () => ({ name: '', short: '', addr: '', latitude: '', longitude: '', phone: '', hours: '', img: '', status: 'active' })
	export default {
		data() { return { id: '', saving: false, form: emptyForm() } },
		onLoad(query) { this.id = query.id || ''; this.load() },
		onShow() { if (!salesStore.authenticated()) uni.redirectTo({ url: '/pagesSales/login/login' }) },
		methods: {
			async load() {
				if (!this.id) return
				let item = salesStore.store(this.id)
				if (!item) { try { await salesStore.loadStores(); item = salesStore.store(this.id) } catch (error) {} }
				if (!item) { uni.showToast({ title: '门店不存在或无权查看', icon: 'none' }); return }
				this.form = { name: item.name, short: item.short, addr: item.addr, latitude: String(item.latitude), longitude: String(item.longitude), phone: item.phone, hours: item.hours, img: item.img || '', status: item.status }
			},
			chooseLocation() {
				uni.chooseLocation({ success: location => {
					this.form.addr = [location.address, location.name].filter(Boolean).join(' ')
					this.form.latitude = String(location.latitude)
					this.form.longitude = String(location.longitude)
				}, fail: error => { if (!String(error.errMsg || '').includes('cancel')) uni.showToast({ title: '请授权位置权限后重试', icon: 'none' }) } })
			},
			async save() {
				if (this.saving) return
				const f = this.form
				if (!f.name.trim() || !f.short.trim() || !f.addr.trim() || !f.phone.trim() || !f.hours.trim() || f.latitude === '' || f.longitude === '') { uni.showToast({ title: '请完整填写门店资料和坐标', icon: 'none' }); return }
				this.saving = true
				try {
					const saved = await salesStore.saveStore(this.id, { ...f, latitude: Number(f.latitude), longitude: Number(f.longitude) })
					uni.showToast({ title: '门店已保存', icon: 'success' })
					setTimeout(() => uni.redirectTo({ url: '/pagesSales/accounts/accounts?id=' + saved.id }), 380)
				} catch (error) { uni.showToast({ title: error.message || '保存失败', icon: 'none' }) }
				finally { this.saving = false }
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg{min-height:100vh;padding-bottom:60rpx}.body{padding-top:22rpx}.intro{padding:4rpx 2rpx 20rpx}.intro text:first-child{display:block;font-size:31rpx;font-weight:800;color:$bl-ink}.intro text:last-child{display:block;margin-top:3rpx;color:$bl-ink-3;font-size:21rpx}.form{padding:26rpx}.form>label{display:block;margin-top:20rpx}.form>label:first-child{margin-top:0}label>text,.coords label>text{display:block;margin-bottom:7rpx;color:$bl-ink-2;font-size:22rpx;font-weight:600}input,textarea{width:100%;padding:0 20rpx;border:1rpx solid $bl-line;border-radius:$bl-r-sm;background:$bl-paper-2;font-size:25rpx;color:$bl-ink}input{height:82rpx}textarea{height:128rpx;padding-top:18rpx}.map-btn{height:70rpx;margin-top:12rpx;display:flex;align-items:center;justify-content:center;gap:8rpx;border:1rpx solid rgba(14,59,46,.22);border-radius:$bl-r-sm;color:$bl-green;font-size:23rpx}.coords{display:grid;grid-template-columns:1fr 1fr;gap:14rpx;margin-top:20rpx}.status{display:flex;align-items:center;justify-content:space-between;margin-top:24rpx;padding:20rpx;background:$bl-green-lt;border-radius:$bl-r-sm}.status view text:first-child{display:block;color:$bl-green;font-size:24rpx;font-weight:700}.status view text:last-child{display:block;color:$bl-ink-3;font-size:19rpx}.save{margin-top:22rpx}
</style>
