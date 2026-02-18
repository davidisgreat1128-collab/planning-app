<template>
  <view class="life-planning">
    <view class="header">
      <text class="title">人生规划</text>
      <text class="subtitle">潜龙勿用 → 亢龙有悔，把握人生六阶段</text>
    </view>

    <!-- 规划列表 -->
    <view class="list" v-if="planningStore.list.length > 0">
      <view
        class="list-item"
        v-for="item in planningStore.list"
        :key="item.id"
        @click="goDetail(item.id)"
      >
        <text class="item-title">{{ item.title }}</text>
        <text class="item-date">{{ item.startDate }}</text>
        <text class="item-status" :class="`status-${item.status}`">{{ statusText(item.status) }}</text>
      </view>
    </view>

    <view class="empty" v-else-if="!planningStore.loading">
      <text>暂无人生规划，点击下方按钮开始</text>
    </view>

    <!-- 创建按钮 -->
    <view class="fab" @click="goCreate">
      <text>+</text>
    </view>
  </view>
</template>

<script>
import { usePlanningStore } from '@/store/planning.js';

export default {
  name: 'LifePlanning',

  setup() {
    const planningStore = usePlanningStore();
    return { planningStore };
  },

  onShow() {
    this.planningStore.loadList('life');
  },

  methods: {
    statusText(status) {
      const map = { active: '进行中', completed: '已完成', paused: '已暂停', cancelled: '已取消' };
      return map[status] || status;
    },
    goDetail(id) {
      uni.navigateTo({ url: `/pages/planning/life/detail?id=${id}` });
    },
    goCreate() {
      uni.navigateTo({ url: '/pages/planning/life/create' });
    }
  }
};
</script>

<style scoped>
.life-planning { padding: 20rpx; }
.header { margin-bottom: 30rpx; }
.title { font-size: 40rpx; font-weight: bold; display: block; }
.subtitle { font-size: 26rpx; color: #999; margin-top: 8rpx; display: block; }
.list-item { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx; display: flex; justify-content: space-between; align-items: center; }
.item-title { font-size: 30rpx; flex: 1; }
.item-date { font-size: 24rpx; color: #999; margin: 0 16rpx; }
.status-active { color: #07c160; }
.status-completed { color: #576b95; }
.status-paused { color: #fa8c16; }
.status-cancelled { color: #999; }
.empty { text-align: center; padding: 80rpx 0; color: #999; }
.fab { position: fixed; right: 40rpx; bottom: 100rpx; width: 100rpx; height: 100rpx; background: #07c160; border-radius: 50rpx; display: flex; align-items: center; justify-content: center; }
.fab text { font-size: 60rpx; color: #fff; line-height: 100rpx; }
</style>
