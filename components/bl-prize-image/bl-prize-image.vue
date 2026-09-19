<template>
 <view class="prize-visual" :class="{ cash: isCash }">
  <image v-if="src && !failed" class="prize-photo" :src="src" mode="aspectFit" @error="failed = true" />
  <view v-else-if="isCash" class="cash-art"><view class="envelope"><view class="envelope-flap"></view><text class="envelope-seal">¥</text></view><text class="cash-caption">现金红包</text></view>
  <view v-else class="goods-art"><bl-icon name="gift" :size="60" color="#94692B" /><text>活动好礼</text></view>
 </view>
</template>
<script>
export default { props: { src: String, type: String }, data() { return { failed: false } }, computed: { isCash() { return ['cash', '现金红包'].includes(this.type) } }, watch: { src() { this.failed = false } } }
</script>
<style scoped>
.prize-visual{width:100%;height:100%;min-height:80rpx;display:flex;align-items:center;justify-content:center;background:#f7f3eb;overflow:hidden;border-radius:inherit}.prize-photo{width:100%;height:100%}.cash{background:#fbefe5}.cash-art{width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8rpx}.envelope{position:relative;width:54%;height:58%;max-height:140rpx;border-radius:12rpx;background:#b43d30;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1rpx solid #a1372a}.envelope-flap{position:absolute;top:-25%;width:100%;height:70%;background:#c64d3b;border-bottom:2rpx solid #e6b67c;border-radius:0 0 50% 50%}.envelope-seal{position:relative;background:#f1ce91;color:#8e4627;border:2rpx solid #e6b67c;border-radius:50%;width:48rpx;height:48rpx;line-height:48rpx;text-align:center;font-size:32rpx;font-weight:700}.cash-caption{font-size:20rpx;color:#913e2d}.goods-art{display:flex;flex-direction:column;align-items:center;gap:12rpx;font-size:20rpx;color:#94692b}
</style>
