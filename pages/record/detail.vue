<template>
	<view class="pg">
		<view class="top-bg-wrap">
			<image class="top-bg" :src="cfg.ruleBg" mode="aspectFill" />
			<view class="top-mask"></view>
		</view>

		<bl-navbar title="领奖凭证" bg="transparent" />

		<view v-if="!logged" class="bl-wrap"><bl-guest icon="ticket" title="登录后查看领奖凭证" reason="record" desc="请登录中奖时使用的微信账户，查看你的奖励与领取状态。" /></view>
		<view v-else-if="!rec" class="bl-wrap"><bl-empty icon="ticket" text="暂未加载领奖凭证" :sub="loadError || '正在查询，请稍候'" /><button class="bl-btn bl-btn-primary" @tap="refreshRecord(true)">重新加载</button></view>
		<view v-else class="bl-wrap">
			<!-- ============ 凭证 ============ -->
			<view class="tk">
				<!-- 上半：奖品 -->
				<view class="tk-a">
					<image class="tk-img" :src="rec.prizeImg" mode="aspectFill" />
					<view class="tk-txt">
						<view class="tk-lv">{{ rec.prizeLevel }} · {{ poolName }}</view>
						<text class="tk-n">{{ rec.prizeName }}</text>
						<text class="tk-spec">{{ rec.prizeSpec }}</text>
						<view class="tk-v">
							<text class="tk-v1">价值</text>
							<text class="tk-v2 bl-num">¥{{ rec.prizeValue }}</text>
						</view>
					</view>
				</view>

				<view v-if="rec.prizeType === 'exchange'" class="exchange-note">到店补 ¥{{ rec.exchangeAmount }}，换购价值 ¥{{ rec.prizeValue }} 的 {{ rec.prizeName }} 1 袋。请在店员确认收款后核销。</view>
				<!-- 撕口 -->
				<view class="tk-cut">
					<view class="tk-cut-l"></view>
					<view class="tk-cut-line"></view>
					<view class="tk-cut-r"></view>
				</view>

				<!-- 下半：核销码 -->
				<view class="tk-b">
					<bl-cash-claim v-if="rec.prizeType === 'cash'" ref="cashPanel" :record="rec" @updated="refreshRecord(false)" />
					<template v-else-if="rec.status === 'pending'">
						<view class="tk-qr">
							<bl-qr :value="'JLJ-' + rec.code" :size="360" color="#102E53" />
						</view>
						<text class="tk-qr-tip">请向门店店员出示此二维码</text>
						<view class="tk-sync" :class="{ busy: refreshing }" @tap="refreshRecord(true)">
							<bl-icon name="refresh-cw" :size="25" color="#102E53" :weight="1.8" />
							<text class="tk-sync-t">{{ refreshing ? '正在刷新核销状态…' : '核销后自动更新，也可点击刷新' }}</text>
						</view>

						<view class="tk-code">
							<view class="tk-code-l">
								<text class="tk-code-k">核销码</text>
								<text class="tk-code-v bl-num">{{ codeSpaced }}</text>
							</view>
							<view class="tk-copy" @tap="copy">
								<bl-icon name="copy" :size="26" color="#102E53" :weight="1.8" />
								<text class="tk-copy-t">复制</text>
							</view>
						</view>

						<view class="tk-cd">
							<bl-icon name="hourglass" :size="26" :color="urgent ? '#C0392B' : '#94692B'" :weight="1.8" />
							<text class="tk-cd-t" :class="{ urgent }">
								剩余 <text class="tk-cd-n">{{ cd.d }}</text> 天
								<text class="tk-cd-n">{{ pad(cd.h) }}</text> 时
								<text class="tk-cd-n">{{ pad(cd.m) }}</text> 分
								<text class="tk-cd-n">{{ pad(cd.s) }}</text> 秒 失效
							</text>
						</view>
					</template>

					<template v-else>
						<view class="tk-done">
							<view class="tk-seal" :class="'seal-' + rec.status">
								<text class="tk-seal-t">{{ stText }}</text>
							</view>
							<view class="tk-done-info">
								<view class="bl-kv" v-if="rec.status === 'verified'">
									<text class="bl-kv-k">核销门店</text>
									<text class="bl-kv-v">{{ rec.storeName }}</text>
								</view>
								<view class="bl-kv" v-if="rec.status === 'verified'">
									<text class="bl-kv-k">核销时间</text>
									<text class="bl-kv-v">{{ fmt(rec.verifyAt, 'YYYY-MM-DD HH:mm') }}</text>
								</view>
								<view class="bl-kv" v-if="rec.status === 'verified'">
									<text class="bl-kv-k">操作人</text>
									<text class="bl-kv-v">{{ rec.verifyByName }}</text>
								</view>
								<view class="bl-kv" v-if="rec.status === 'expired'">
									<text class="bl-kv-k">失效时间</text>
									<text class="bl-kv-v">{{ fmt(rec.expireAt, 'YYYY-MM-DD HH:mm') }}</text>
								</view>
								<view class="bl-kv" v-if="rec.status === 'frozen'">
									<text class="bl-kv-k">冻结原因</text>
									<text class="bl-kv-v">{{ rec.frozenReason }}</text>
								</view>
							</view>
						</view>
					</template>
				</view>
			</view>

			<!-- ============ 领取门店 ============ -->
			<view v-if="rec.status === 'pending' && rec.prizeType !== 'cash'" class="st bl-card">
				<view class="st-h">
					<view class="bl-sec-l">
						<view class="bl-sec-bar"></view>
						<text class="st-h-t">领取门店</text>
					</view>
					<view class="st-h-r" @tap="showPick = true">
						<text>更换</text>
						<bl-icon name="chevron-right" :size="22" color="#60768C" :weight="2" />
					</view>
				</view>
				<view class="st-body" v-if="preferStore">
					<image class="st-img" :src="preferStore.img" mode="aspectFill" />
					<view class="st-txt">
						<text class="st-n">{{ preferStore.short }}</text>
						<view class="st-r">
							<bl-icon name="map-pin" :size="22" color="#60768C" :weight="1.8" />
							<text class="st-a bl-ellipsis">{{ preferStore.addr }}</text>
						</view>
						<view class="st-r">
							<text class="bl-tag bl-tag-green">营业 {{ preferStore.open }}</text>
							<text class="st-d bl-num">{{ preferStore.distance }} km</text>
						</view>
					</view>
				</view>
				<view class="st-tip">
					<bl-icon name="info" :size="24" color="#94692B" :weight="1.8" />
					<text class="st-tip-t">凭证在全部 {{ stores.length }} 家合作门店均可核销，此处仅为默认导航门店</text>
				</view>
			</view>

			<!-- ============ 核销流程 ============ -->
			<view v-if="rec.prizeType !== 'cash'" class="flow bl-card">
				<view class="flow-h">
					<view class="bl-sec-bar"></view>
					<text class="flow-h-t">核销流程</text>
				</view>
				<view v-for="(s, i) in cfg.verifySteps" :key="i" class="flow-i">
					<text class="flow-no bl-num">{{ i + 1 }}</text>
					<text class="flow-t">{{ s }}</text>
				</view>
			</view>

			<!-- ============ 订单信息 ============ -->
			<view class="info bl-card">
				<view class="flow-h">
					<view class="bl-sec-bar"></view>
					<text class="flow-h-t">订单信息</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">订单号</text>
					<text class="bl-kv-v bl-num">{{ rec.id }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">兑换码</text>
					<text class="bl-kv-v bl-num">{{ rec.code }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">所属批次</text>
					<text class="bl-kv-v">{{ rec.batchId }}（{{ rec.price }} 元档）</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">对应奖池</text>
					<text class="bl-kv-v">{{ poolName }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">兑奖时间</text>
					<text class="bl-kv-v">{{ fmt(rec.redeemAt, 'YYYY-MM-DD HH:mm:ss') }}</text>
				</view>
				<view class="bl-kv">
					<text class="bl-kv-k">领取截止</text>
					<text class="bl-kv-v">{{ fmt(rec.expireAt, 'YYYY-MM-DD HH:mm') }}</text>
				</view>
			</view>

			<view class="svc" @tap="callService">
				<bl-icon name="headphones" :size="34" color="#102E53" :weight="1.8" />
				<text class="svc-t">领奖遇到问题？联系客服 {{ cfg.service.phone }}</text>
				<bl-icon name="chevron-right" :size="26" color="#9AAEBF" :weight="2" />
			</view>
		</view>

		<!-- ============ 门店选择 ============ -->
		<bl-popup v-model:show="showPick" type="bottom">
			<view class="pk">
				<view class="pk-h">
					<text class="pk-h-t">选择领取门店</text>
					<view class="pk-h-x" @tap="showPick = false">
						<bl-icon name="x" :size="32" color="#60768C" :weight="2" />
					</view>
				</view>
				<scroll-view class="pk-list" scroll-y>
					<view v-for="s in stores" :key="s.id" class="pk-i" @tap="pick(s)">
						<image class="pk-img" :src="s.img" mode="aspectFill" />
						<view class="pk-txt">
							<text class="pk-n">{{ s.short }}</text>
							<text class="pk-a bl-ellipsis">{{ s.addr }}</text>
						</view>
						<view class="pk-r">
							<text class="pk-d bl-num">{{ s.distance }}km</text>
							<view class="pk-ck" :class="{ on: rec && rec.preferStoreId === s.id }">
								<bl-icon v-if="rec && rec.preferStoreId === s.id" name="check" :size="24"
									color="#fff" :weight="2.4" />
							</view>
						</view>
					</view>
				</scroll-view>
				<view class="bl-safe-b"></view>
			</view>
		</bl-popup>
	</view>
</template>

<script>
	import store from '@/store/index.js'
	import { fmt, countdown, daysLeft } from '@/utils/date.js'
	const STATUS_POLL_MS = 2000

	export default {
		data() {
			return {
				id: '',
				currentRecord: null,
				recordSession: '',
				loadError: '',
				showPick: false,
				cd: { d: 0, h: 0, m: 0, s: 0 },
				timer: null,
				statusTimer: null,
				pageVisible: false,
				syncing: false,
				refreshing: false
			}
		},
		computed: {
			cfg() { return store.state.config },
			stores() { return store.STORES },
			logged() { return store.isCustomerAuthenticated() },
			rec() { return this.logged ? ((this.recordSession === store.state.customerToken ? this.currentRecord : null) || store.recordById(this.id)) : null },
			poolName() {
				const p = this.rec && store.poolById(this.rec.poolId)
				return p ? p.name : '—'
			},
			preferStore() {
				return this.rec ? store.storeById(this.rec.preferStoreId) : null
			},
			codeSpaced() {
				return this.rec ? this.rec.code.split('').join(' ') : ''
			},
			urgent() {
				return this.rec ? daysLeft(this.rec.expireAt) <= 3 : false
			},
			stText() {
				return {
					verified: '已核销', expired: '已失效', frozen: '已冻结'
				}[this.rec && this.rec.status] || ''
			}
		},
		onLoad(opt) {
			this.id = (opt && (opt.id || opt.code)) || ''
			this.recordSession = store.state.customerToken
			if (opt && opt.code) {
				const r = store.recordByCode(opt.code)
				if (r) {
					this.id = r.id
					this.currentRecord = r
				}
			} else {
				this.currentRecord = store.recordById(this.id) || null
			}
			this.tick()
			this.timer = setInterval(this.tick, 1000)
		},
		onShow() {
			this.pageVisible = true
			this.refreshRecord(false).finally(() => this.startStatusPolling())
		},
		onHide() {
			this.pageVisible = false
			this.stopStatusPolling()
		},
		onUnload() {
			clearInterval(this.timer)
			this.stopStatusPolling()
		},
		methods: {
			fmt,
			pad(n) { return n < 10 ? '0' + n : '' + n },
			tick() {
				if (this.rec && this.rec.expireAt) this.cd = countdown(this.rec.expireAt)
			},
			startStatusPolling() {
				this.stopStatusPolling()
				if (!this.pageVisible || !this.rec || this.rec.status !== 'pending') return
				this.statusTimer = setInterval(() => this.refreshRecord(false), STATUS_POLL_MS)
			},
			stopStatusPolling() {
				if (this.statusTimer) clearInterval(this.statusTimer)
				this.statusTimer = null
			},
			async refreshRecord(manual = false) {
				if (!this.id || this.syncing) return
				if (!this.logged) { this.currentRecord = null; this.stopStatusPolling(); return }
				const token = store.state.customerToken
				const previousStatus = this.rec && this.rec.status
				this.syncing = true
				if (manual) this.refreshing = true
				try {
					const latest = await store.refreshCustomerRecord(this.id)
					if (token !== store.state.customerToken || !this.logged) return
					this.id = latest.id
					this.currentRecord = latest
					this.recordSession = token
					this.loadError = ''
					if (latest.prizeType === 'cash') this.$refs.cashPanel?.refresh()
					this.tick()
					if (latest.status !== 'pending') this.stopStatusPolling()
					if (previousStatus === 'pending' && latest.status === 'verified') {
						if (typeof uni.vibrateShort === 'function') {
							uni.vibrateShort({ fail: () => {} })
						}
						uni.showToast({ title: latest.prizeType === 'cash' ? '现金已到账' : '核销成功，凭证已更新', icon: 'success' })
					} else if (manual) {
						const statusText = { pending: '待核销', verified: '已核销', expired: '已失效', frozen: '已冻结' }[latest.status] || '已更新'
						uni.showToast({ title: '当前状态：' + statusText, icon: 'none' })
					}
				} catch (error) {
					this.loadError = error.message || '请检查网络后重新加载'
					if (!this.logged || error.code === 'ERR_SESSION_CHANGED' || error.status === 404) { this.currentRecord = null; this.stopStatusPolling() }
					if (manual) uni.showToast({ title: error.message || '状态刷新失败', icon: 'none' })
				} finally {
					this.syncing = false
					this.refreshing = false
				}
			},
			copy() {
				uni.setClipboardData({
					data: this.rec.code,
					success: () => uni.showToast({ title: '核销码已复制', icon: 'none' })
				})
			},
			async pick(s) {
				try {
					this.currentRecord = await store.changePreferStore(this.rec.id, s.id)
					this.showPick = false
					uni.showToast({ title: '已切换至 ' + s.short, icon: 'none' })
				} catch (error) {
					uni.showToast({ title: error.message || '门店切换失败', icon: 'none' })
				}
			},
			callService() {
				uni.makePhoneCall({
					phoneNumber: this.cfg.service.phone,
					fail: () => {}
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
.exchange-note{padding:24rpx 30rpx;background:$bl-gold-lt;color:$bl-gold;font-size:26rpx;line-height:1.8}
	.pg {
		min-height: 100vh;
		background: $bl-paper;
		padding-bottom: 70rpx;
	}

	.top-bg-wrap {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 460rpx;
	}

	.top-bg {
		width: 100%;
		height: 100%;
	}

	.top-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(180deg, rgba(9, 31, 59, 0.88) 0%, rgba(16, 46, 83, 0.9) 55%, $bl-paper 100%);
	}

	/* ============ 凭证 ============ */
	.tk {
		position: relative;
		z-index: 3;
		background: $bl-card;
		border-radius: $bl-r-xl;
		box-shadow: 0 20rpx 50rpx rgba(9, 31, 59, 0.22);
		overflow: hidden;
	}

	.tk-a {
		display: flex;
		padding: 30rpx 28rpx;
	}

	.tk-img {
		width: 180rpx;
		height: 180rpx;
		border-radius: $bl-r-md;
		flex-shrink: 0;
		background: #F2F1EC;
	}

	.tk-txt {
		flex: 1;
		margin-left: 24rpx;
		min-width: 0;
	}

	.tk-lv {
		display: inline-block;
		height: 36rpx;
		line-height: 36rpx;
		padding: 0 14rpx;
		border-radius: 6rpx;
		background: $bl-gold-lt;
		color: $bl-gold;
		font-size: 20rpx;
		font-weight: 700;
		border: 1rpx solid rgba(184, 137, 43, 0.3);
	}

	.tk-n {
		display: block;
		margin-top: 12rpx;
		font-size: 38rpx;
		font-weight: 800;
		color: $bl-ink;
	}

	.tk-spec {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: $bl-ink-4;
	}

	.tk-v {
		margin-top: 12rpx;
		display: flex;
		align-items: baseline;
	}

	.tk-v1 {
		font-size: 20rpx;
		color: $bl-ink-4;
		margin-right: 6rpx;
	}

	.tk-v2 {
		font-size: 34rpx;
		color: $bl-red;
	}

	/* 撕口 */
	.tk-cut {
		position: relative;
		height: 40rpx;
		display: flex;
		align-items: center;
	}

	.tk-cut-l,
	.tk-cut-r {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background: $bl-paper;
	}

	.tk-cut-l {
		margin-left: -20rpx;
	}

	.tk-cut-r {
		margin-right: -20rpx;
	}

	.tk-cut-line {
		flex: 1;
		height: 2rpx;
		margin: 0 16rpx;
		background-image: linear-gradient(90deg, $bl-line 0 14rpx, transparent 14rpx 28rpx);
		background-size: 28rpx 2rpx;
		background-repeat: repeat-x;
	}

	.tk-b {
		padding: 20rpx 28rpx 34rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.tk-qr {
		padding: 16rpx;
		background: #fff;
		border: 1rpx solid $bl-line;
		border-radius: $bl-r-md;
	}

	.tk-qr-tip {
		margin-top: 16rpx;
		font-size: 22rpx;
		color: $bl-ink-4;
	}

	.tk-sync {
		width: 100%;
		min-height: 68rpx;
		margin-top: 18rpx;
		padding: 12rpx 18rpx;
		border: 1rpx solid rgba(16, 46, 83, 0.16);
		border-radius: $bl-r-sm;
		background: $bl-green-lt;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 180ms ease-out;

		&.busy {
			opacity: 0.62;
		}
	}

	.tk-sync-t {
		margin-left: 8rpx;
		font-size: 22rpx;
		color: $bl-green;
	}

	.tk-code {
		margin-top: 24rpx;
		width: 100%;
		height: 104rpx;
		background: $bl-paper-2;
		border: 1rpx dashed rgba(16, 46, 83, 0.28);
		border-radius: $bl-r-md;
		display: flex;
		align-items: center;
		padding: 0 24rpx;
	}

	.tk-code-l {
		flex: 1;
		display: flex;
		align-items: baseline;
	}

	.tk-code-k {
		font-size: 22rpx;
		color: $bl-ink-4;
		margin-right: 16rpx;
	}

	.tk-code-v {
		font-size: 42rpx;
		color: $bl-green;
		letter-spacing: 4rpx;
	}

	.tk-copy {
		display: flex;
		align-items: center;
		height: 56rpx;
		padding: 0 18rpx;
		border-radius: $bl-r-sm;
		background: #fff;
		border: 1rpx solid $bl-line;
	}

	.tk-copy-t {
		margin-left: 6rpx;
		font-size: 23rpx;
		color: $bl-green;
	}

	.tk-cd {
		margin-top: 20rpx;
		display: flex;
		align-items: center;
	}

	.tk-cd-t {
		margin-left: 8rpx;
		font-size: 23rpx;
		color: $bl-ink-2;

		&.urgent {
			color: $bl-red;
		}
	}

	.tk-cd-n {
		font-weight: 800;
		font-size: 27rpx;
		margin: 0 2rpx;
	}

	/* 已核销 / 失效 */
	.tk-done {
		width: 100%;
		padding: 20rpx 0 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.tk-seal {
		width: 220rpx;
		height: 220rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transform: rotate(-14deg);
		border: 8rpx solid;
		opacity: 0.9;
	}

	.tk-seal-t {
		font-size: 46rpx;
		font-weight: 800;
		letter-spacing: 6rpx;
	}

	.seal-verified {
		border-color: rgba(67, 118, 171, 0.55);

		.tk-seal-t {
			color: rgba(67, 118, 171, 0.75);
		}
	}

	.seal-expired {
		border-color: rgba(140, 150, 145, 0.5);

		.tk-seal-t {
			color: rgba(140, 150, 145, 0.7);
		}
	}

	.seal-frozen {
		border-color: rgba(192, 57, 43, 0.5);

		.tk-seal-t {
			color: rgba(192, 57, 43, 0.75);
		}
	}

	.tk-done-info {
		margin-top: 30rpx;
		width: 100%;
		padding-top: 10rpx;
		border-top: 1rpx dashed $bl-line;
	}

	/* ============ 门店 ============ */
	.st {
		margin-top: 26rpx;
		padding: 26rpx;
	}

	.st-h {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.st-h-t {
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.st-h-r {
		display: flex;
		align-items: center;
		font-size: 24rpx;
		color: $bl-ink-3;
	}

	.st-body {
		margin-top: 22rpx;
		display: flex;
	}

	.st-img {
		width: 168rpx;
		height: 126rpx;
		border-radius: $bl-r-sm;
		flex-shrink: 0;
	}

	.st-txt {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
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
		margin-top: 8rpx;
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

	.st-tip {
		margin-top: 22rpx;
		padding: 16rpx 18rpx;
		background: $bl-gold-lt;
		border-radius: $bl-r-sm;
		display: flex;
		align-items: flex-start;
	}

	.st-tip-t {
		flex: 1;
		margin-left: 10rpx;
		font-size: 21rpx;
		color: #8A6520;
		line-height: 1.6;
	}

	/* ============ 流程 / 信息 ============ */
	.flow,
	.info {
		margin-top: 26rpx;
		padding: 26rpx;
	}

	.flow-h {
		display: flex;
		align-items: center;
		margin-bottom: 18rpx;
	}

	.flow-h-t {
		font-size: 30rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.flow-i {
		display: flex;
		margin-top: 14rpx;
	}

	.flow-no {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		background: $bl-green-lt;
		color: $bl-green;
		font-size: 20rpx;
		text-align: center;
		line-height: 36rpx;
		flex-shrink: 0;
	}

	.flow-t {
		flex: 1;
		margin-left: 14rpx;
		font-size: 24rpx;
		color: $bl-ink-2;
		line-height: 1.6;
	}

	/* ============ 客服 ============ */
	.svc {
		margin-top: 26rpx;
		height: 100rpx;
		background: $bl-card;
		border: 1rpx solid $bl-line;
		border-radius: $bl-r-lg;
		display: flex;
		align-items: center;
		padding: 0 26rpx;
	}

	.svc-t {
		flex: 1;
		margin-left: 16rpx;
		font-size: 25rpx;
		color: $bl-ink;
	}

	/* ============ 门店选择 ============ */
	.pk {
		background: $bl-card;
		border-radius: $bl-r-xl $bl-r-xl 0 0;
		overflow: hidden;
	}

	.pk-h {
		height: 100rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-bottom: 1rpx solid $bl-line-2;
		position: relative;
	}

	.pk-h-t {
		font-size: 32rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.pk-h-x {
		position: absolute;
		right: 24rpx;
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pk-list {
		max-height: 720rpx;
	}

	.pk-i {
		display: flex;
		align-items: center;
		padding: 22rpx 28rpx;
		border-bottom: 1rpx solid $bl-line-2;
	}

	.pk-img {
		width: 110rpx;
		height: 84rpx;
		border-radius: $bl-r-sm;
		flex-shrink: 0;
	}

	.pk-txt {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
	}

	.pk-n {
		display: block;
		font-size: 27rpx;
		font-weight: 700;
		color: $bl-ink;
	}

	.pk-a {
		display: block;
		margin-top: 4rpx;
		font-size: 21rpx;
		color: $bl-ink-3;
	}

	.pk-r {
		display: flex;
		align-items: center;
	}

	.pk-d {
		font-size: 22rpx;
		color: $bl-gold;
		margin-right: 16rpx;
	}

	.pk-ck {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		border: 2rpx solid $bl-line;
		display: flex;
		align-items: center;
		justify-content: center;

		&.on {
			background: $bl-green;
			border-color: $bl-green;
		}
	}
</style>
