<template>
  <view class="guide-page">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-left" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">如何正确分配规划</text>
      <view class="nav-right">
        <text class="menu-icon">⋯</text>
      </view>
    </view>

    <!-- 滚动内容区 -->
    <scroll-view class="scroll-content" scroll-y>
      <!-- 顶部插图 -->
      <view class="hero-section">
        <view class="hero-card">
          <view class="hero-title-wrapper">
            <view class="hero-badge">如何正确</view>
            <text class="hero-title">分配规划</text>
          </view>
          <view class="hero-illustration">
            <text class="illustration-emoji">🚣</text>
          </view>
        </view>

        <!-- 问题说明 -->
        <view class="problem-section">
          <text class="problem-text">大多数人在做规划时往往就是把规划简单地记录下来，更甚一步还会给规划设置完成时间，但这样的做规划方式存在以下弊端：</text>

          <view class="problem-list">
            <view class="problem-item">
              <text class="warning-icon">⚠️</text>
              <text class="problem-desc">只有待办，没有重点</text>
            </view>
            <view class="problem-item">
              <text class="warning-icon">⚠️</text>
              <text class="problem-desc">重时间把控，轻做事效率</text>
            </view>
          </view>

          <text class="problem-conclusion">进而导致规划完成的效率和成果大打折扣！！</text>
        </view>
      </view>

      <!-- 分隔线 -->
      <view class="section-divider"></view>

      <!-- 如何正确分配规划 -->
      <view class="method-section">
        <view class="method-header">
          <text class="method-number">00</text>
          <text class="method-title">如何正确分配规划？</text>
          <text class="method-subtitle">How to allocate</text>
        </view>

        <view class="steps-list">
          <view class="step-item">
            <view class="step-number">1</view>
            <text class="step-text">首先，明确你的目标是什么。目标可以是一个项目、任务或任何需要完成的事项。</text>
          </view>

          <view class="step-item">
            <view class="step-number">2</view>
            <text class="step-text">其次，当你需要将某项规划归到你的规划表时，以目标为衡量标准，去评估该项规划的紧急重要性。</text>
          </view>

          <view class="step-item">
            <view class="step-number">3</view>
            <text class="step-text">最后，在此基础上将规划分配到【四象限】中。</text>
          </view>
        </view>
      </view>

      <!-- 四象限说明 -->
      <view class="quadrant-section">
        <view class="quadrant-grid">
          <!-- 紧急不重要 -->
          <view class="quadrant-card yellow">
            <view class="card-header">
              <text class="card-icon">📋</text>
              <text class="card-title">紧急不重要</text>
            </view>
            <text class="card-content">要求立即完成，但对于目标而言并不是最重要的。</text>
            <text class="card-content">考虑是否可以<text class="highlight">委派给他人</text>或者通过其他方式解决。</text>
          </view>

          <!-- 重要且紧急 -->
          <view class="quadrant-card pink">
            <view class="card-header">
              <text class="card-icon">📋</text>
              <text class="card-title">重要且紧急</text>
            </view>
            <text class="card-content">当务之急，需要<text class="highlight">立即行动</text>并投入大量时间和精力来完成。</text>
            <text class="card-content">将这些规划放在<text class="highlight">优先考虑</text>的位置。</text>
          </view>

          <!-- 不重要不紧急 -->
          <view class="quadrant-card green">
            <view class="card-header">
              <text class="card-icon">📋</text>
              <text class="card-title">不重要不紧急</text>
            </view>
            <text class="card-content">这些规划对于你的目标来说<text class="highlight">没有价值</text>，尽量避免投入大量时间和精力。</text>
          </view>

          <!-- 重要不紧急 -->
          <view class="quadrant-card purple">
            <view class="card-header">
              <text class="card-icon">📋</text>
              <text class="card-title">重要不紧急</text>
            </view>
            <text class="card-content">这里的规划是具备<text class="highlight">长期价值</text>的，不需要立即行动，给予足够的时间和注意力来确保它们<text class="highlight">在适当的时间</text>得到处理即可。</text>
          </view>
        </view>
      </view>

      <!-- 示例 -->
      <view class="example-section">
        <view class="example-header">
          <text class="example-title"># 示例</text>
        </view>

        <text class="example-intro">假定你现在有一个"考研上岸"的目标，这时候你的室友约你周末一起去看电影，<text class="highlight-orange">以目标为衡量标准</text>，该项规划就会被归到不重要不紧急象限中。</text>

        <!-- 示例四象限 -->
        <view class="example-quadrant-grid">
          <!-- 紧急不重要 - 示例 -->
          <view class="example-quadrant-card yellow">
            <view class="card-header">
              <text class="card-icon">📋</text>
              <text class="card-title">紧急不重要</text>
            </view>
            <view class="example-list">
              <view class="example-item">
                <text class="checkbox">⭕</text>
                <text class="item-text">早睡</text>
              </view>
              <view class="example-item">
                <text class="checkbox">⭕</text>
                <text class="item-text">早起</text>
              </view>
              <view class="example-item">
                <text class="checkbox">⭕</text>
                <text class="item-text">练八段锦</text>
              </view>
            </view>
          </view>

          <!-- 重要且紧急 - 示例 -->
          <view class="example-quadrant-card pink">
            <view class="card-header">
              <text class="card-icon">📋</text>
              <text class="card-title">重要且紧急</text>
            </view>
            <view class="example-list">
              <view class="example-item">
                <text class="checkbox">☑</text>
                <text class="item-text">英语复习</text>
              </view>
              <view class="example-item">
                <text class="checkbox">☑</text>
                <text class="item-text">思忠祥高数课</text>
              </view>
              <view class="example-item">
                <text class="checkbox">⭕</text>
                <text class="item-text strikethrough">看参考书和笔记</text>
              </view>
            </view>
          </view>

          <!-- 不重要不紧急 - 示例 -->
          <view class="example-quadrant-card green">
            <view class="card-header">
              <text class="card-icon">📋</text>
              <text class="card-title">不重要不紧急</text>
            </view>
            <view class="example-list">
              <view class="example-item">
                <text class="checkbox">⭕</text>
                <text class="item-text">散步</text>
              </view>
              <view class="example-item">
                <text class="checkbox">⭕</text>
                <text class="item-text">和室友看电影</text>
              </view>
            </view>
          </view>

          <!-- 重要不紧急 - 示例 -->
          <view class="example-quadrant-card purple">
            <view class="card-header">
              <text class="card-icon">📋</text>
              <text class="card-title">重要不紧急</text>
            </view>
            <view class="example-list">
              <view class="example-item">
                <text class="checkbox">⭕</text>
                <text class="item-text">TED英语演讲</text>
              </view>
              <view class="example-item">
                <text class="checkbox">⭕</text>
                <text class="item-text">徐涛强化课（核心考案）</text>
              </view>
              <view class="example-item">
                <text class="checkbox">⭕</text>
                <text class="item-text">肖《1000》</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 箭头指示 -->
        <view class="arrow-indicator">
          <text class="arrow-text">→</text>
        </view>
      </view>

      <!-- 总结 -->
      <view class="conclusion-section">
        <view class="conclusion-card">
          <text class="conclusion-text">通过以目标为中心去完成规划的分配，确保在处理重要规划时专注且高效，可以更好地管理时间、提高效率，掌握生活的主动权。</text>
          <view class="conclusion-mascot">
            <text class="mascot-emoji">🐔</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup>
// 返回上一页
function goBack() {
  uni.navigateBack();
}
</script>

<style scoped>
.guide-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
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
  width: 80rpx;
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
  width: 80rpx;
  display: flex;
  justify-content: flex-end;
}

.menu-icon {
  font-size: 48rpx;
  color: #333;
  cursor: pointer;
}

/* ============================================================
   滚动内容
   ============================================================ */
.scroll-content {
  flex: 1;
  padding: 30rpx 20rpx 140rpx;
  width: 100%;
  box-sizing: border-box;
}

/* ============================================================
   顶部英雄区
   ============================================================ */
.hero-section {
  margin-bottom: 40rpx;
}

.hero-card {
  background: linear-gradient(135deg, #B8E6E1 0%, #87CEEB 100%);
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  position: relative;
  overflow: hidden;
  margin-bottom: 30rpx;
}

.hero-title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.hero-badge {
  background-color: #FFFACD;
  padding: 10rpx 30rpx;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.hero-title {
  font-size: 72rpx;
  font-weight: 800;
  color: #333;
  text-align: center;
  line-height: 1.2;
}

.hero-illustration {
  display: flex;
  justify-content: center;
  align-items: center;
}

.illustration-emoji {
  font-size: 120rpx;
}

/* 问题说明区 */
.problem-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx 25rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.problem-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  display: block;
  margin-bottom: 25rpx;
}

.problem-list {
  margin: 20rpx 0;
}

.problem-item {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 15rpx;
}

.warning-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.problem-desc {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.problem-conclusion {
  font-size: 28rpx;
  color: #FF6B6B;
  font-weight: 600;
  display: block;
  margin-top: 20rpx;
}

/* ============================================================
   分隔线
   ============================================================ */
.section-divider {
  height: 2rpx;
  background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
  margin: 40rpx 0;
}

/* ============================================================
   方法说明区
   ============================================================ */
.method-section {
  margin-bottom: 40rpx;
}

.method-header {
  margin-bottom: 30rpx;
}

.method-number {
  font-size: 80rpx;
  font-weight: 800;
  color: #e0e0e0;
  display: block;
  line-height: 1;
  margin-bottom: 10rpx;
}

.method-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.method-subtitle {
  font-size: 28rpx;
  color: #999;
  font-style: italic;
  display: block;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background-color: #fff;
  padding: 25rpx;
  border-radius: 12rpx;
}

.step-number {
  width: 48rpx;
  height: 48rpx;
  background-color: #5B8CFF;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
}

/* ============================================================
   四象限说明区
   ============================================================ */
.quadrant-section {
  margin-bottom: 40rpx;
}

.quadrant-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.quadrant-card {
  border-radius: 16rpx;
  padding: 25rpx 20rpx;
  min-height: 280rpx;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  box-sizing: border-box;
  position: relative;
}

.quadrant-card.yellow {
  background-color: #FFF9E6;
  border: 2rpx solid #FFD700;
}

.quadrant-card.pink {
  background-color: #FFE6F0;
  border: 2rpx solid #FFB6C1;
}

.quadrant-card.green {
  background-color: #E6F7F1;
  border: 2rpx solid #90EE90;
}

.quadrant-card.purple {
  background-color: #F0E6FF;
  border: 2rpx solid #DDA0DD;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.card-icon {
  font-size: 32rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
}

.card-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
  display: block;
}

.highlight {
  color: #FF6B6B;
  font-weight: 600;
}

/* ============================================================
   示例区
   ============================================================ */
.example-section {
  margin-bottom: 40rpx;
}

.example-header {
  margin-bottom: 20rpx;
}

.example-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #333;
  background-color: #F5E6D3;
  padding: 10rpx 30rpx;
  display: inline-block;
  border-radius: 8rpx;
}

.example-intro {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  display: block;
  margin-bottom: 30rpx;
  background-color: #fff;
  padding: 25rpx;
  border-radius: 12rpx;
}

.highlight-orange {
  color: #FF9800;
  font-weight: 600;
}

.example-quadrant-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 30rpx;
}

.example-quadrant-card {
  border-radius: 16rpx;
  padding: 20rpx 15rpx;
  min-height: 250rpx;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  box-sizing: border-box;
}

.example-quadrant-card.yellow {
  background-color: #FFF9E6;
  border: 2rpx solid #FFD700;
}

.example-quadrant-card.pink {
  background-color: #FFE6F0;
  border: 2rpx solid #FFB6C1;
}

.example-quadrant-card.green {
  background-color: #E6F7F1;
  border: 2rpx solid #90EE90;
}

.example-quadrant-card.purple {
  background-color: #F0E6FF;
  border: 2rpx solid #DDA0DD;
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.checkbox {
  font-size: 28rpx;
  flex-shrink: 0;
}

.item-text {
  font-size: 26rpx;
  color: #333;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.item-text.strikethrough {
  text-decoration: line-through;
  color: #999;
}

.arrow-indicator {
  display: flex;
  justify-content: center;
  margin: 20rpx 0;
}

.arrow-text {
  font-size: 80rpx;
  color: #333;
  font-weight: 700;
}

/* ============================================================
   总结区
   ============================================================ */
.conclusion-section {
  margin-bottom: 40rpx;
}

.conclusion-card {
  background-color: #fff;
  border: 2rpx solid #333;
  border-radius: 16rpx;
  padding: 30rpx 25rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-sizing: border-box;
}

.conclusion-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  min-width: 0;
}

.conclusion-mascot {
  flex-shrink: 0;
}

.mascot-emoji {
  font-size: 80rpx;
}

/* ============================================================
   底部占位
   ============================================================ */
.bottom-spacer {
  height: 40rpx;
}
</style>
