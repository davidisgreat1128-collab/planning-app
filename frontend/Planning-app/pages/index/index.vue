<template>
  <view class="home-page">
    <!-- 顶部欢迎区 -->
    <view class="header">
      <view class="welcome">
        <text class="greeting">你好，{{ nickname }}</text>
        <text class="date">{{ today }}</text>
      </view>
      <view class="avatar-wrap" @click="goProfile">
        <image class="avatar" src="/static/logo.png" mode="aspectFill" />
      </view>
    </view>

    <!-- 功能入口九宫格 -->
    <view class="grid">
      <view class="grid-item" v-for="item in modules" :key="item.path" @click="goPage(item.path)">
        <text class="grid-icon">{{ item.icon }}</text>
        <text class="grid-label">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/store/user.js';

export default {
  name: 'HomePage',

  data() {
    return {
      // 七大规划模块入口
      modules: [
        { label: '人生规划', icon: '🌟', path: '/pages/planning/life/index' },
        { label: '职业规划', icon: '💼', path: '/pages/planning/career/index' },
        { label: '项目规划', icon: '🚀', path: '/pages/planning/project/index' },
        { label: '情绪规划', icon: '💭', path: '/pages/planning/mood/index' },
        { label: '健康规划', icon: '❤️', path: '/pages/planning/health/index' },
        { label: '时间规划', icon: '⏰', path: '/pages/planning/time/index' },
        { label: '习惯规划', icon: '📋', path: '/pages/planning/habit/index' },
        { label: '易经起卦', icon: '🎴', path: '/pages/iching/divination/index' },
        { label: '人生阶段', icon: '📊', path: '/pages/iching/stage/index' },
      ]
    };
  },

  computed: {
    nickname() {
      const userStore = useUserStore();
      return userStore.nickname;
    },
    today() {
      // 格式化今日日期，如"2026年2月17日 星期二"
      const d = new Date();
      const weeks = ['日', '一', '二', '三', '四', '五', '六'];
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weeks[d.getDay()]}`;
    }
  },

  onLoad() {
    // 进入首页时检查登录状态，未登录则跳转
    const userStore = useUserStore();
    console.log('[Home] onLoad, isLoggedIn:', userStore.isLoggedIn, 'token:', !!userStore.token);
    if (!userStore.isLoggedIn) {
      console.warn('[Home] 未登录，跳转登录页');
      uni.reLaunch({ url: '/pages/user/login' });
    } else {
      console.log('[Home] 已登录，用户:', userStore.userInfo);
    }
  },

  methods: {
    goPage(path) {
      uni.navigateTo({ url: path });
    },
    goProfile() {
      uni.navigateTo({ url: '/pages/user/profile' });
    }
  }
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0 0 40rpx;
}
.header {
  background: #07c160;
  padding: 80rpx 40rpx 50rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.greeting {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}
.date {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}
.avatar-wrap {
  flex-shrink: 0;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.6);
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  padding: 30rpx 24rpx;
}
.grid-item {
  background: #fff;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}
.grid-icon {
  font-size: 56rpx;
  margin-bottom: 16rpx;
}
.grid-label {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}
</style>
