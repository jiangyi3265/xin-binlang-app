<template>
 <view class="draw-page">
  <view class="draw-header" :style="{ backgroundImage: 'url(' + cfg.homeBg + ')' }">
   <bl-navbar title="幸运翻牌" bg="transparent" :fixed="false" />
   <view class="draw-heading"><text class="draw-kicker">{{ cfg.brand }} · 一码一礼</text><text class="draw-title">{{ stage === 'input' ? '好礼，藏在下一张牌里' : revealed ? '你的翻牌结果' : '选一张，翻开你的好礼' }}</text><text class="draw-sub">{{ stage === 'input' ? '输入包装内的兑换码，开启翻牌' : '每个兑换码限翻一张，选定后不可更换' }}</text></view>
  </view>
  <view class="draw-body">
   <view v-if="stage === 'input'" class="input-panel">
    <view class="input-product"><image :src="cfg.productImg" mode="aspectFit" /><view><text class="panel-title">包装内 6 位兑换码</text><text class="panel-note">请妥善保管包装，勿与他人共享兑换码</text></view></view>
    <input class="code-input" type="text" :value="code" maxlength="6" placeholder="请输入 6 位兑换码" confirm-type="done" @input="onInput" @confirm="prepare" />
    <text v-if="tip" class="draw-error">{{ tip }}</text>
    <button class="action primary" :disabled="code.length !== 6" @tap="prepare">开始选牌</button>
    <text class="input-note">{{ logged ? '一码一次，翻牌结果自动保存' : '选牌前请先完成微信登录' }}</text>
   </view>
   <view v-else class="cards-panel">
    <view class="selection-status"><text>兑换码 {{ maskedCode }}</text><text>{{ loading ? '正在确定结果…' : revealed ? '已翻开第 ' + selected + ' 张牌' : '从下方 6 张牌中选择 1 张' }}</text></view>
    <bl-flip-cards :brand="cfg.brand" :background="cfg.homeBg" :selected="selected" :busy="loading" :revealed="revealed" :reward-type="rewardType" :title="cardTitle" :detail="cardDetail" @select="choose" />
    <text v-if="tip" class="draw-error">{{ tip }}</text>
    <button v-if="tip && !revealed" class="action primary" @tap="retry">{{ selected ? '查询本次翻牌结果' : '重新输入兑换码' }}</button>
    <view v-if="revealed" class="draw-result">
     <text class="result-eyebrow">{{ rewardType === 'lose' ? '本次结果' : '已为你保存奖励' }}</text>
     <text class="result-title">{{ resultTitle }}</text>
     <text class="result-desc">{{ resultDescription }}</text>
     <view v-if="rewardType === 'exchange'" class="exchange-summary"><view><text>到店补款</text><text class="amount">¥{{ rec.exchangeAmount }}</text></view><view><text>换购商品价值</text><text class="amount">¥{{ rec.prizeValue }} / 袋</text></view></view>
     <button v-if="rewardType !== 'lose'" class="action primary" @tap="toDetail">{{ rewardType === 'cash' ? '去领取现金红包' : '查看换购 / 领奖凭证' }}</button>
     <button class="action secondary" @tap="again">输入下一个兑换码</button>
     <text class="result-foot">开奖结果已保存，可在“兑奖记录”查看</text>
    </view>
    <button v-else-if="!loading && !selected" class="edit-code" @tap="stage = 'input'">返回修改兑换码</button>
   </view>
   <view class="reward-guide"><text class="guide-title">翻牌后，如何领取？</text><view><text class="guide-no">01</text><view><text>谢谢惠顾</text><text class="guide-desc">本次未中奖，感谢你的参与。</text></view></view><view><text class="guide-no">02</text><view><text>加价换购</text><text class="guide-desc">按凭证金额到店补差价，核销后领取一袋对应商品。</text></view></view><view><text class="guide-no">03</text><view><text>现金红包</text><text class="guide-desc">点击领取并按微信提示确认，到账状态可随时查询。</text></view></view></view>
  </view>
 </view>
</template>
<script>
import store from '@/store/index.js'
import { requireCustomerLogin } from '@/utils/api.js'
export default {
 data() { return { code: '', stage: 'input', selected: 0, loading: false, revealed: false, tip: '', result: {}, resumeAfterLogin: false, flipTimer: null } },
 computed: {
  cfg() { return store.state.config }, logged() { return store.isCustomerAuthenticated() }, rec() { return this.result.record || {} },
  maskedCode() { return this.code.slice(0, 2) + '••' + this.code.slice(-2) },
  rewardType() { return this.rec.win ? this.rec.prizeType || 'goods' : 'lose' },
  cardTitle() { return this.rewardType === 'lose' ? '谢谢惠顾' : this.rewardType === 'cash' ? '¥' + this.rec.prizeValue : this.rewardType === 'exchange' ? '加 ¥' + this.rec.exchangeAmount : '恭喜中奖' },
  cardDetail() { return this.rewardType === 'lose' ? '感谢你的参与' : this.rewardType === 'cash' ? '现金红包' : this.rewardType === 'exchange' ? '换一袋 ¥' + this.rec.prizeValue + ' 商品' : this.rec.prizeName },
  resultTitle() { return this.rewardType === 'lose' ? '谢谢惠顾' : this.rewardType === 'cash' ? this.rec.prizeValue + ' 元现金红包' : this.rec.prizeName },
  resultDescription() { return this.rewardType === 'lose' ? '本次未中奖。你可以在兑奖记录中查看这次结果。' : this.rewardType === 'cash' ? '红包待领取。完成微信收款确认后，以实际转账结果为准。' : this.rewardType === 'exchange' ? '凭此奖励到合作门店补款，店员确认后领取一袋商品。' : this.rec.prizeSpec + '，请在凭证有效期内到店领取。' }
 },
 onLoad(options) { if (options?.code) this.code = String(options.code).toUpperCase().slice(0, 6) },
 onShow() { if (this.resumeAfterLogin) { this.resumeAfterLogin = false; if (this.logged) this.prepare() } },
 onUnload() { clearTimeout(this.flipTimer) },
 methods: {
  onInput(event) { this.code = (event.detail.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); this.tip = '' },
  prepare() { if (this.code.length !== 6) { this.tip = '请输入完整的 6 位兑换码'; return } if (!this.logged) { this.resumeAfterLogin = true; requireCustomerLogin({ reason: 'redeem' }); return } this.tip = ''; this.stage = 'choose' },
  async choose(card) {
   if (this.loading || this.revealed || (this.selected && this.selected !== card)) return
   this.selected = card; this.loading = true; this.tip = ''
   const result = await store.redeem(this.code, card)
   this.loading = false
   if (!result.ok) {
    this.tip = result.msg || '网络异常，请查询本次结果'
    if (['ERR_FORMAT','ERR_INVALID','ERR_USED','ERR_CLOSED','ERR_LIMIT','ERR_BLOCKED','ERR_NO_STORE','ERR_BATCH_PAUSED','ERR_BATCH_EXPIRED','ERR_OUTSIDE_ACTIVITY','ERR_CASH_NOT_CONFIGURED','ERR_CASH_AMOUNT'].includes(result.code)) this.selected = 0
    if (result.code === 'ERR_AUTH' || result.code === 'ERR_AUTH_REQUIRED') { this.resumeAfterLogin = true; requireCustomerLogin({ reason: 'redeem' }) }
    return
   }
   this.result = result; this.selected = result.record.selectedCard || card
   this.flipTimer = setTimeout(() => { this.revealed = true; if (typeof uni.vibrateShort === 'function') uni.vibrateShort({ fail: () => {} }) }, 80)
  },
  retry() { if (this.selected) this.choose(this.selected); else this.stage = 'input' },
  again() { clearTimeout(this.flipTimer); this.code = ''; this.stage = 'input'; this.selected = 0; this.revealed = false; this.result = {}; this.tip = '' },
  toDetail() { uni.navigateTo({ url: '/pages/record/detail?id=' + this.rec.id }) }
 }
}
</script>
<style lang="scss" scoped>
.draw-page{min-height:100vh;background:$bl-paper;padding-bottom:60rpx}.draw-header{background-color:$bl-green;background-size:cover;background-position:center;color:#fff;padding-bottom:76rpx}.draw-heading{padding:18rpx 32rpx 20rpx;display:flex;flex-direction:column}.draw-kicker{color:$bl-gold-3;font-size:24rpx;letter-spacing:3rpx}.draw-title{font-size:42rpx;line-height:1.4;font-weight:800;margin-top:15rpx}.draw-sub{font-size:24rpx;color:#c1d3e5;margin-top:12rpx}.draw-body{margin:-38rpx 28rpx 0;position:relative}.input-panel,.cards-panel{padding:28rpx;background:$bl-card;border:1rpx solid $bl-line;border-radius:24rpx}.input-product{display:flex;align-items:center;gap:22rpx;margin-bottom:26rpx}.input-product image{width:104rpx;height:146rpx;flex-shrink:0}.input-product>view{display:flex;flex-direction:column;gap:12rpx}.panel-title{font-size:30rpx;font-weight:700;color:$bl-ink}.panel-note{font-size:23rpx;line-height:1.7;color:$bl-ink-3}.code-input{height:100rpx;padding:0 24rpx;background:#f3f7fb;border:2rpx solid #bbcbda;border-radius:14rpx;font-size:30rpx;letter-spacing:4rpx;color:$bl-ink}.action{display:flex;align-items:center;justify-content:center;width:100%;min-height:88rpx;margin-top:22rpx;border-radius:14rpx;font-size:28rpx;font-weight:700;line-height:1.5;padding:16rpx 20rpx;box-sizing:border-box}.action:after{border:0}.primary{background:$bl-green;color:#fff}.primary[disabled]{background:#d9e3ed;color:#60768c}.secondary{background:#f0f4f8;color:$bl-ink;border:1rpx solid $bl-line}.input-note{display:block;text-align:center;font-size:22rpx;color:$bl-ink-3;margin-top:20rpx}.selection-status{display:flex;justify-content:space-between;font-size:21rpx;color:$bl-ink-3;margin-bottom:26rpx;gap:10rpx}.draw-error{display:block;margin-top:20rpx;color:$bl-danger;font-size:25rpx;line-height:1.7}.edit-code{margin:28rpx auto 0;color:$bl-ink-2;background:transparent;font-size:24rpx}.edit-code:after{border:0}.draw-result{margin-top:30rpx;padding-top:30rpx;border-top:1rpx solid $bl-line;display:flex;flex-direction:column}.result-eyebrow{color:$bl-gold;font-size:22rpx}.result-title{font-size:36rpx;font-weight:800;color:$bl-ink;margin:10rpx 0 14rpx}.result-desc{font-size:25rpx;line-height:1.7;color:$bl-ink-2}.result-foot{font-size:21rpx;color:$bl-ink-3;line-height:1.7;margin-top:20rpx;text-align:center}.exchange-summary{display:flex;gap:20rpx;padding:24rpx 0}.exchange-summary>view{display:flex;flex:1;flex-direction:column;gap:10rpx;font-size:22rpx;color:$bl-ink-3}.exchange-summary .amount{font-size:32rpx;color:$bl-gold;font-weight:700}.reward-guide{padding:32rpx 14rpx}.guide-title{font-size:28rpx;font-weight:700;color:$bl-ink}.reward-guide>view{display:flex;gap:20rpx;margin-top:24rpx;font-size:25rpx;color:$bl-ink}.reward-guide>view>view{display:flex;flex-direction:column;gap:8rpx}.guide-no{font-size:22rpx;color:$bl-gold;font-weight:700}.guide-desc{font-size:23rpx;color:$bl-ink-3;line-height:1.7}
</style>
