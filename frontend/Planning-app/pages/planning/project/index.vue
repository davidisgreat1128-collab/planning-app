<template>
  <view class="page">
    <view class="placeholder">
      <text class="page-title">项目规划</text>
      <text class="page-desc">功能开发中...</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PlanningProject',
};
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
.placeholder { text-align: center; }
.page-title { display: block; font-size: 36rpx; font-weight: bold; color: #333; }
.page-desc { display: block; font-size: 26rpx; color: #999; margin-top: 16rpx; }
</style>
