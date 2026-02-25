<template>
  <view class="template-page">
    <!-- 导航栏 -->
    <view class="navbar">
      <view class="nav-left" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">规划模板</text>
      <view class="nav-right" @tap="createCustomGoal">
        <text class="add-icon">⊕</text>
        <text class="nav-right-text">设置我的个人规划</text>
      </view>
    </view>

    <!-- 滚动内容区 -->
    <scroll-view class="scroll-content" scroll-y>
      <!-- 激励语卡片 -->
      <view class="motivation-card">
        <view class="motivation-bubble">
          <text class="motivation-text">想象一下瘦下10斤后的模样，你会感谢今天的自己</text>
        </view>
        <image class="motivation-img" src="/static/images/motivation-character.png" mode="aspectFit" />
      </view>

      <!-- 推荐卡片 -->
      <view class="recommend-section">
        <view class="recommend-tag">推荐</view>
        <view class="recommend-card" @tap="selectTemplate(recommendedTemplate)">
          <view class="recommend-info">
            <text class="recommend-title">{{ recommendedTemplate.title }}</text>
            <text class="recommend-users">{{ recommendedTemplate.users }}人坚持</text>
            <text class="recommend-desc">{{ recommendedTemplate.desc }}</text>
          </view>
          <image class="recommend-img" :src="recommendedTemplate.coverImage" mode="aspectFill" />
        </view>
      </view>

      <!-- 分类标签 -->
      <view class="category-tabs">
        <view
          v-for="tab in categoryTabs"
          :key="tab.key"
          class="category-tab"
          :class="{ active: currentCategory === tab.key }"
          @tap="switchCategory(tab.key)"
        >
          <text class="tab-text">{{ tab.label }}</text>
        </view>
      </view>

      <!-- 规划模板网格 -->
      <view class="template-grid">
        <view
          v-for="template in filteredTemplates"
          :key="template.id"
          class="template-card"
          @tap="selectTemplate(template)"
        >
          <image class="template-img" :src="template.coverImage" mode="aspectFill" />
          <view class="template-info">
            <text class="template-title"># {{ template.title }}</text>
            <text class="template-users">{{ template.users }}人坚持</text>
            <text class="template-tag">{{ template.tag }}</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

// 分类标签
const categoryTabs = ref([
  { key: 'all', label: '全部' },
  { key: 'study', label: '学习' },
  { key: 'work', label: '工作' },
  { key: 'hobby', label: '兴趣' },
  { key: 'health', label: '健康' }
]);

const currentCategory = ref('all');

// 推荐模板
const recommendedTemplate = ref({
  id: 'rec_1',
  title: '30天懒人式蜕变维密身材',
  users: 6392,
  desc: '无器械/宅家可练',
  coverImage: '/static/images/template-fitness.jpg',
  category: 'health'
});

// 规划模板列表
const templates = ref([
  {
    id: 'tpl_1',
    title: '一个科学的攒钱模式',
    users: 8141,
    tag: '培养理财能力',
    coverImage: '/static/images/template-money.jpg',
    category: 'work'
  },
  {
    id: 'tpl_2',
    title: '循序渐进养成良好作息',
    users: 9504,
    tag: '作息改善',
    coverImage: '/static/images/template-sleep.jpg',
    category: 'health'
  },
  {
    id: 'tpl_3',
    title: '晨跑打卡计划',
    users: 5623,
    tag: '健康生活',
    coverImage: '/static/images/template-running.jpg',
    category: 'health'
  },
  {
    id: 'tpl_4',
    title: '每日任务清单',
    users: 7234,
    tag: '效率提升',
    coverImage: '/static/images/template-checklist.jpg',
    category: 'work'
  }
]);

// 筛选后的模板
const filteredTemplates = computed(() => {
  if (currentCategory.value === 'all') {
    return templates.value;
  }
  return templates.value.filter(t => t.category === currentCategory.value);
});

// 切换分类
function switchCategory(category) {
  currentCategory.value = category;
}

// 选择模板
function selectTemplate(template) {
  console.log('[Template] 选择模板:', template);
  uni.navigateTo({
    url: `/pages/planning/template/detail?id=${template.id}`
  });
}

// 创建自定义规划
function createCustomGoal() {
  console.log('[Template] 创建自定义规划');
  uni.navigateTo({
    url: '/pages/planning/template/custom'
  });
}

// 返回
function goBack() {
  uni.navigateBack();
}
</script>

<style scoped>
.template-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* ============================================================
   导航栏
   ============================================================ */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #e0e0e0;
}

.nav-left {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.back-icon {
  font-size: 48rpx;
  color: #333;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
}

.add-icon {
  font-size: 32rpx;
  color: #333;
}

.nav-right-text {
  font-size: 28rpx;
  color: #333;
}

/* ============================================================
   滚动内容
   ============================================================ */
.scroll-content {
  flex: 1;
  padding: 30rpx 20rpx; /* 减少左右内边距,避免边框被裁剪 */
  box-sizing: border-box;
}

/* ============================================================
   激励语卡片
   ============================================================ */
.motivation-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 30rpx;
  gap: 20rpx;
}

.motivation-bubble {
  flex: 1;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  border: 2rpx solid #333;
  position: relative;
}

.motivation-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
}

.motivation-img {
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
}

/* ============================================================
   推荐卡片
   ============================================================ */
.recommend-section {
  position: relative;
  margin-bottom: 30rpx;
}

.recommend-tag {
  position: absolute;
  top: -10rpx;
  left: 20rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  color: #fff;
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx 20rpx 20rpx 0;
  z-index: 1;
  font-weight: 600;
}

.recommend-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2rpx solid #333;
  cursor: pointer;
  transition: all 0.2s;
}

.recommend-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.recommend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.recommend-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.recommend-users {
  font-size: 24rpx;
  color: #666;
}

.recommend-desc {
  font-size: 24rpx;
  color: #999;
}

.recommend-img {
  width: 200rpx;
  height: 150rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

/* ============================================================
   分类标签
   ============================================================ */
.category-tabs {
  display: flex;
  gap: 30rpx;
  margin-bottom: 30rpx;
  overflow-x: auto;
  padding-bottom: 10rpx;
}

.category-tab {
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-text {
  font-size: 32rpx;
  color: #999;
  font-weight: 500;
  transition: all 0.2s;
}

.category-tab.active .tab-text {
  color: #333;
  font-weight: 600;
  font-size: 36rpx;
}

/* ============================================================
   模板网格
   ============================================================ */
.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 0 10rpx; /* 左右各留10rpx,确保边框完整 */
}

.template-card {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  border: 2rpx solid #333;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
  width: 100%; /* 让卡片填充网格单元 */
}

.template-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.template-img {
  width: 100%;
  height: 280rpx;
  display: block;
}

.template-info {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.template-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #FF8E53;
}

.template-users {
  font-size: 24rpx;
  color: #666;
}

.template-tag {
  font-size: 24rpx;
  color: #999;
}

/* 底部占位 */
.bottom-spacer {
  height: 40rpx;
}
</style>
