<template>
	<view class="pg bl-paper-tex">
		<bl-navbar title="员工管理" bg="paper" home="/pagesStore/home/home" />

		<view class="bl-wrap">
			<view class="tip">
				<bl-icon name="users" :size="30" color="#4376AB" :weight="1.8" />
				<view class="tip-txt">
					<text class="tip-t">本店共 {{ list.length }} 个账号</text>
					<text class="tip-d">店主可创建店员账号；店员仅能执行核销，无数据查看与设置权限</text>
				</view>
			</view>

			<view v-for="a in list" :key="a.id" class="sf bl-card">
				<image class="sf-ava" :src="a.avatar" mode="aspectFill" />
				<view class="sf-txt">
					<view class="sf-r1">
						<text class="sf-n">{{ a.name }}</text>
						<text class="bl-tag" :class="a.role === 'owner' ? 'bl-tag-gold' : 'bl-tag-green'">
							{{ a.role === 'owner' ? '店主' : '店员' }}
						</text>
						<text v-if="a.id === me.id" class="bl-tag bl-tag-blue" style="margin-left:10rpx">当前登录</text>
					</view>
					<text class="sf-a">账号 {{ a.account }} · {{ a.phone }}</text>
					<text class="sf-j">加入于 {{ a.joinAt }} · 累计核销 {{ verifyCount(a.id) }} 单</text>
					<view class="sf-perm">
						<view v-for="(p, i) in perms(a.role)" :key="i" class="sf-p" :class="{ no: !p.on }">
							<bl-icon :name="p.on ? 'check' : 'x'" :size="18"
								:color="p.on ? '#4376AB' : '#9AAEBF'" :weight="2.6" />
							<text class="sf-p-t">{{ p.t }}</text>
						</view>
					</view>
				</view>
				<view v-if="a.role === 'staff' && me.role === 'owner'" class="sf-act" @tap="toggleStaff(a)">
					<text>{{ a.active === false ? '启用' : '停用' }}</text>
				</view>
			</view>

			<view v-if="me.role === 'owner'" class="add" @tap="showAdd = !showAdd">
				<bl-icon name="plus" :size="34" color="#102E53" :weight="2" />
				<text class="add-t">新增店员账号</text>
			</view>

			<view v-if="showAdd" class="add-form bl-card">
				<text class="form-t">开通店员子账号</text>
				<input v-model="form.name" class="form-in" placeholder="员工姓名" maxlength="30" />
				<input v-model="form.username" class="form-in" placeholder="登录账号（字母或数字）" maxlength="40" />
				<input v-model="form.phone" class="form-in" placeholder="联系电话" maxlength="30" />
				<input v-model="form.password" class="form-in" password placeholder="初始密码（至少 8 位）" maxlength="60" />
				<view class="bl-btn bl-btn-primary form-btn" @tap="addStaff">
					<text>{{ saving ? '正在创建…' : '确认创建' }}</text>
				</view>
			</view>

			<view class="note">
				<bl-icon name="info" :size="24" color="#60768C" :weight="1.8" />
				<text class="note-t">账号创建、停用和重置密码均由服务端校验并记录操作日志。</text>
			</view>
		</view>

		<bl-storebar active="me" />
	</view>
</template>

<script>
	import store from '@/store/index.js'

	export default {
		data() {
			return { showAdd: false, saving: false, form: { name: '', username: '', phone: '', password: '' } }
		},
		computed: {
			me() { return store.account() || {} },
			list() {
				const sid = this.me.storeId
				return store.staffList().filter(a => a.storeId === sid)
			}
		},
		onShow() {
			if (!store.account()) uni.redirectTo({ url: '/pagesStore/login/login' })
		},
		methods: {
			verifyCount(id) {
				return store.storeLogs().filter(l => l.byId === id && l.type === 'verify').length
			},
			perms(role) {
				const owner = role === 'owner'
				return [
					{ t: '扫码/输码核销', on: true },
					{ t: '查看本店数据', on: owner },
					{ t: '导出报表', on: owner },
					{ t: '查看核销日志', on: owner }
				]
			},
			async addStaff() {
				if (this.saving) return
				if (!this.form.name || !this.form.username || this.form.password.length < 8) {
					uni.showToast({ title: '请完整填写，密码至少 8 位', icon: 'none' })
					return
				}
				this.saving = true
				try {
					await store.createStaff(this.form)
					this.form = { name: '', username: '', phone: '', password: '' }
					this.showAdd = false
					uni.showToast({ title: '店员账号已创建', icon: 'success' })
				} catch (error) {
					uni.showToast({ title: error.message || '创建失败', icon: 'none' })
				} finally {
					this.saving = false
				}
			},
			async toggleStaff(account) {
				try {
					await store.updateStaff(account.id, { active: account.active === false })
					uni.showToast({ title: account.active === false ? '账号已启用' : '账号已停用', icon: 'none' })
				} catch (error) {
					uni.showToast({ title: error.message || '操作失败', icon: 'none' })
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.pg {
		min-height: 100vh;
	}

	.tip {
		margin-top: 14rpx;
		display: flex;
		align-items: flex-start;
		padding: 22rpx;
		background: $bl-green-lt;
		border: 1rpx solid rgba(67, 118, 171, 0.2);
		border-radius: $bl-r-md;
	}

	.tip-txt {
		flex: 1;
		margin-left: 14rpx;
	}

	.tip-t {
		display: block;
		font-size: 26rpx;
		font-weight: 700;
		color: #1E5540;
	}

	.tip-d {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: #40705C;
		line-height: 1.5;
	}

	.sf {
		margin-top: 20rpx;
		padding: 24rpx;
		display: flex;
	}

	.sf-ava {
		width: 96rpx;
		height: 96rpx;
		border-radius: $bl-r-md;
		flex-shrink: 0;
	}

	.sf-txt {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
	}

	.sf-act {
		align-self: flex-start;
		margin-left: 12rpx;
		padding: 8rpx 14rpx;
		border: 1rpx solid $bl-line;
		border-radius: $bl-r-sm;
		font-size: 20rpx;
		color: $bl-red;
	}

	.sf-r1 {
		display: flex;
		align-items: center;
	}

	.sf-n {
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
		margin-right: 12rpx;
	}

	.sf-a {
		display: block;
		margin-top: 6rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
	}

	.sf-j {
		display: block;
		margin-top: 2rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
	}

	.sf-perm {
		margin-top: 14rpx;
		display: flex;
		flex-wrap: wrap;
	}

	.sf-p {
		display: flex;
		align-items: center;
		height: 40rpx;
		padding: 0 14rpx;
		border-radius: 6rpx;
		background: $bl-green-lt;
		margin-right: 12rpx;
		margin-bottom: 10rpx;

		&.no {
			background: #F2F1EC;
		}
	}

	.sf-p-t {
		margin-left: 6rpx;
		font-size: 19rpx;
		color: $bl-ink-2;
	}

	.sf-p.no .sf-p-t {
		color: $bl-ink-4;
		text-decoration: line-through;
	}

	.add {
		margin-top: 26rpx;
		height: 100rpx;
		border-radius: $bl-r-md;
		border: 1rpx dashed rgba(16, 46, 83, 0.32);
		background: rgba(255, 255, 255, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.add-t {
		margin-left: 12rpx;
		font-size: 27rpx;
		color: $bl-green;
		font-weight: 600;
	}

	.add-form {
		margin-top: 18rpx;
		padding: 26rpx;
	}

	.form-t {
		display: block;
		margin-bottom: 18rpx;
		font-size: 28rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.form-in {
		height: 82rpx;
		margin-top: 14rpx;
		padding: 0 20rpx;
		border: 1rpx solid $bl-line;
		border-radius: $bl-r-sm;
		background: $bl-paper-2;
		font-size: 24rpx;
	}

	.form-btn {
		margin-top: 22rpx;
	}

	.note {
		margin-top: 26rpx;
		display: flex;
		align-items: flex-start;
	}

	.note-t {
		flex: 1;
		margin-left: 8rpx;
		font-size: 20rpx;
		color: $bl-ink-4;
		line-height: 1.6;
	}
</style>
