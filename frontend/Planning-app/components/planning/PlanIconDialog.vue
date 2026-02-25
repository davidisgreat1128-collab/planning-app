<template>
  <view v-if="visible" class="icon-dialog-mask" @tap="onMaskTap">
    <view class="icon-dialog" @tap.stop>
      <!-- 标题 -->
      <view class="dialog-title">选择贴纸</view>

      <!-- 图标分类标签 -->
      <view class="icon-tabs">
        <text
          v-for="tab in iconTabs"
          :key="tab.key"
          class="icon-tab"
          :class="{ active: currentTab === tab.key }"
          @tap="currentTab = tab.key"
        >{{ tab.label }}</text>
      </view>

      <!-- 图标网格 -->
      <view class="icon-grid">
        <view
          v-for="icon in currentIcons"
          :key="icon.id"
          class="icon-item"
          :class="{ selected: selectedIcon === icon.id }"
          @tap="showPreview(icon.id)"
        >
          <text class="icon-emoji">{{ icon.emoji }}</text>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="dialog-buttons">
        <view class="dialog-btn cancel-btn" @tap="onCancel">取消</view>
        <view class="dialog-btn save-btn" @tap="onSave">保存</view>
      </view>
    </view>

    <!-- 图标预览弹窗 -->
    <view v-if="showIconPreview" class="icon-preview-mask" @tap="closeIconPreview">
      <view class="icon-preview-dialog" @tap.stop>
        <text class="preview-hint" @tap.stop="openTutorial">使用教程</text>

        <view class="preview-icon-wrapper">
          <text class="preview-icon">{{ getIconById(previewIconId)?.emoji }}</text>
          <view class="preview-tag">贴纸</view>
        </view>

        <text class="preview-name">{{ getIconById(previewIconId)?.name }}</text>

        <!-- 选择按钮 -->
        <view class="preview-select-btn" @tap="selectIconFromPreview">
          <text class="select-btn-text">选择此图标</text>
        </view>

        <!-- 关闭按钮 -->
        <view class="preview-close" @tap="closeIconPreview">
          <text class="close-icon">✕</text>
        </view>
      </view>
    </view>

    <!-- 使用教程弹窗 -->
    <view v-if="showTutorial" class="tutorial-mask" @tap="closeTutorial">
      <view class="tutorial-dialog" @tap.stop>
        <!-- 教程视频区域 -->
        <view class="tutorial-demo">
          <video
            class="tutorial-video"
            src="/static/tutorial.mp4"
            :autoplay="true"
            :loop="true"
            :controls="false"
            :show-center-play-btn="false"
            :show-play-btn="false"
            :enable-progress-gesture="false"
            :show-fullscreen-btn="false"
            :show-mute-btn="false"
            objectFit="contain"
          ></video>
        </view>

        <!-- 教程说明文字 -->
        <view class="tutorial-content">
          <text class="tutorial-title">规划贴纸教程</text>
          <text class="tutorial-desc">为规划选择贴纸后，在显示规划时会展示所选贴纸图标</text>
        </view>

        <!-- 知道了按钮 -->
        <view class="tutorial-button" @tap="closeTutorial">
          <text class="tutorial-btn-text">知道了</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// ============================================================
// Props & Emits
// ============================================================
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  initialIcon: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:visible', 'save']);

// ============================================================
// 状态
// ============================================================
const selectedIcon = ref('');
const currentTab = ref('work');

// 图标预览
const showIconPreview = ref(false);
const previewIconId = ref('');

// 使用教程弹窗
const showTutorial = ref(false);

// ============================================================
// 图标数据
// ============================================================
const iconTabs = [
  { key: 'work', label: '工作' },
  { key: 'life', label: '生活' },
  { key: 'study', label: '学习' },
  { key: 'sport', label: '运动' },
  { key: 'interest', label: '兴趣' },
  { key: 'other', label: '其他' }
];

const allIcons = {
  // 工作分类
  work: [
    { id: 'work_1', emoji: '🗂️', name: '文件夹' },
    { id: 'work_2', emoji: '✉️', name: '邮件' },
    { id: 'work_3', emoji: '💼', name: '公文包' },
    { id: 'work_4', emoji: '☎️', name: '电话' },
    { id: 'work_5', emoji: '📋', name: '笔记' },
    { id: 'work_6', emoji: '👥', name: '团队' },
    { id: 'work_7', emoji: '🌍', name: '全球' },
    { id: 'work_8', emoji: '🍹', name: '饮料' },
    { id: 'work_9', emoji: '🍵', name: '茶杯' },
    { id: 'work_10', emoji: '📖', name: '书本' },
    { id: 'work_11', emoji: '🍌', name: '香蕉' },
    { id: 'work_12', emoji: '☕', name: '咖啡' },
    { id: 'work_13', emoji: '⌨️', name: '键盘' },
    { id: 'work_14', emoji: '✈️', name: '飞机' },
    { id: 'work_15', emoji: '🥧', name: '派' },
    { id: 'work_16', emoji: '💻', name: '电脑' },
    { id: 'work_17', emoji: '☕', name: '咖啡杯' },
    { id: 'work_18', emoji: '🔥', name: '火焰' },
    { id: 'work_19', emoji: '🐦', name: '鸟' },
    { id: 'work_20', emoji: '📇', name: '卡片' }
  ],

  // 生活分类
  life: [
    { id: 'life_1', emoji: '☕', name: '咖啡' },
    { id: 'life_2', emoji: '🥩', name: '肉' },
    { id: 'life_3', emoji: '🥫', name: '罐头' },
    { id: 'life_4', emoji: '🧺', name: '洗衣' },
    { id: 'life_5', emoji: '🧊', name: '冰箱' },
    { id: 'life_6', emoji: '🧹', name: '扫帚' },
    { id: 'life_7', emoji: '🕷️', name: '蜘蛛' },
    { id: 'life_8', emoji: '🧾', name: '账单' },
    { id: 'life_9', emoji: '🥗', name: '沙拉' },
    { id: 'life_10', emoji: '🧊', name: '冰块' },
    { id: 'life_11', emoji: '🛒', name: '购物车' },
    { id: 'life_12', emoji: '🍰', name: '蛋糕' },
    { id: 'life_13', emoji: '💊', name: '药品' },
    { id: 'life_14', emoji: '🛏️', name: '床' },
    { id: 'life_15', emoji: '🌺', name: '花' },
    { id: 'life_16', emoji: '🥬', name: '蔬菜' },
    { id: 'life_17', emoji: '🪑', name: '椅子' },
    { id: 'life_18', emoji: '🚗', name: '汽车' },
    { id: 'life_19', emoji: '🐕', name: '狗' },
    { id: 'life_20', emoji: '🏠', name: '房子' }
  ],

  // 学习分类
  study: [
    { id: 'study_1', emoji: '📁', name: '文件夹' },
    { id: 'study_2', emoji: '📚', name: '书籍' },
    { id: 'study_3', emoji: '📖', name: '书本' },
    { id: 'study_4', emoji: '📕', name: '红书' },
    { id: 'study_5', emoji: '📃', name: '纸张' },
    { id: 'study_6', emoji: '💻', name: '电脑' },
    { id: 'study_7', emoji: '🎓', name: '毕业帽' },
    { id: 'study_8', emoji: '🗒️', name: '笔记本' },
    { id: 'study_9', emoji: '✏️', name: '铅笔' },
    { id: 'study_10', emoji: '🎯', name: '目标' },
    { id: 'study_11', emoji: '📙', name: '橙书' },
    { id: 'study_12', emoji: '📄', name: '文档' },
    { id: 'study_13', emoji: '📱', name: '手机' },
    { id: 'study_14', emoji: '📗', name: '绿书' },
    { id: 'study_15', emoji: '📘', name: '蓝书' },
    { id: 'study_16', emoji: '🎨', name: '调色板' },
    { id: 'study_17', emoji: '🎸', name: '吉他' },
    { id: 'study_18', emoji: '🎹', name: '钢琴' },
    { id: 'study_19', emoji: '🎭', name: '戏剧' },
    { id: 'study_20', emoji: '🏆', name: '奖杯' }
  ],

  // 运动分类
  sport: [
    { id: 'sport_1', emoji: '👟', name: '运动鞋' },
    { id: 'sport_2', emoji: '🏋️', name: '举重' },
    { id: 'sport_3', emoji: '🏐', name: '排球' },
    { id: 'sport_4', emoji: '🏀', name: '篮球' },
    { id: 'sport_5', emoji: '⚽', name: '足球' },
    { id: 'sport_6', emoji: '🤸', name: '体操' },
    { id: 'sport_7', emoji: '🏸', name: '羽毛球' },
    { id: 'sport_8', emoji: '🏊', name: '游泳' },
    { id: 'sport_9', emoji: '🎾', name: '网球' },
    { id: 'sport_10', emoji: '🏃', name: '跑步' },
    { id: 'sport_11', emoji: '🚴', name: '骑行' },
    { id: 'sport_12', emoji: '🧘', name: '瑜伽' },
    { id: 'sport_13', emoji: '🥊', name: '拳击' }
  ],

  // 兴趣分类
  interest: [
    { id: 'interest_1', emoji: '📜', name: '卷轴' },
    { id: 'interest_2', emoji: '🎮', name: '游戏' },
    { id: 'interest_3', emoji: '📺', name: '电视' },
    { id: 'interest_4', emoji: '📰', name: '报纸' },
    { id: 'interest_5', emoji: '📗', name: '绿书' },
    { id: 'interest_6', emoji: '⛺', name: '露营' },
    { id: 'interest_7', emoji: '☕', name: '咖啡' },
    { id: 'interest_8', emoji: '⛺', name: '帐篷' },
    { id: 'interest_9', emoji: '🚲', name: '自行车' },
    { id: 'interest_10', emoji: '🍟', name: '薯条' },
    { id: 'interest_11', emoji: '🍿', name: '爆米花' },
    { id: 'interest_12', emoji: '🎂', name: '蛋糕' },
    { id: 'interest_13', emoji: '🥤', name: '饮料' },
    { id: 'interest_14', emoji: '🍜', name: '拉面' },
    { id: 'interest_15', emoji: '🔧', name: '工具' },
    { id: 'interest_16', emoji: '🎸', name: '吉他' },
    { id: 'interest_17', emoji: '🎹', name: '钢琴' },
    { id: 'interest_18', emoji: '📦', name: '盒子' },
    { id: 'interest_19', emoji: '🎯', name: '飞镖' },
    { id: 'interest_20', emoji: '🥇', name: '金牌' }
  ],

  // 其他分类
  other: [
    { id: 'other_1', emoji: '🏀', name: '篮球' },
    { id: 'other_2', emoji: '⚪', name: '白圈' },
    { id: 'other_3', emoji: '❌', name: '叉号' },
    { id: 'other_4', emoji: '⭕', name: '圆圈' },
    { id: 'other_5', emoji: '🎫', name: '票' },
    { id: 'other_6', emoji: '☁️', name: '云' },
    { id: 'other_7', emoji: '🎐', name: '风铃' },
    { id: 'other_8', emoji: '🌸', name: '樱花' },
    { id: 'other_9', emoji: '🍱', name: '便当' },
    { id: 'other_10', emoji: '❄️', name: '雪花' },
    { id: 'other_11', emoji: '🚩', name: '旗帜' },
    { id: 'other_12', emoji: '🍂', name: '落叶' },
    { id: 'other_13', emoji: '🥜', name: '花生' }
  ]
};

// ============================================================
// 计算属性
// ============================================================
const currentIcons = computed(() => allIcons[currentTab.value] || []);

// ============================================================
// 方法
// ============================================================

/**
 * 根据ID获取图标
 */
function getIconById(id) {
  for (const category of Object.values(allIcons)) {
    const icon = category.find(i => i.id === id);
    if (icon) return icon;
  }
  return null;
}

/**
 * 从预览弹窗选择图标
 */
function selectIconFromPreview() {
  selectedIcon.value = previewIconId.value;
  showIconPreview.value = false;
  uni.showToast({
    title: '图标已选择',
    icon: 'success',
    duration: 1500
  });
}

/**
 * 显示图标预览
 */
function showPreview(iconId) {
  previewIconId.value = iconId;
  showIconPreview.value = true;
}

/**
 * 关闭图标预览
 */
function closeIconPreview() {
  showIconPreview.value = false;
}

/**
 * 打开使用教程
 */
function openTutorial() {
  showTutorial.value = true;
  showIconPreview.value = false;
}

/**
 * 关闭使用教程
 */
function closeTutorial() {
  showTutorial.value = false;
  showIconPreview.value = true;
}

/**
 * 点击遮罩关闭
 */
function onMaskTap() {
  emit('update:visible', false);
}

/**
 * 取消
 */
function onCancel() {
  emit('update:visible', false);
}

/**
 * 保存
 */
function onSave() {
  if (!selectedIcon.value) {
    uni.showToast({ title: '请选择图标', icon: 'none' });
    return;
  }

  emit('save', {
    icon: selectedIcon.value,
    iconEmoji: getIconById(selectedIcon.value)?.emoji
  });
  emit('update:visible', false);
}

// ============================================================
// 监听弹窗显示状态
// ============================================================
watch(() => props.visible, (val) => {
  if (val) {
    // 弹窗打开时
    if (props.initialIcon) {
      selectedIcon.value = props.initialIcon;

      // 根据图标ID找到对应的分类标签
      const iconData = getIconById(props.initialIcon);
      if (iconData) {
        const tabKey = props.initialIcon.split('_')[0];
        if (iconTabs.find(t => t.key === tabKey)) {
          currentTab.value = tabKey;
        }
      }
    } else {
      // 默认选中铃铛图标（如果存在）
      selectedIcon.value = 'other_1'; // 可以设置默认图标
      currentTab.value = 'work';
    }
  } else {
    // 弹窗关闭时，清空预览状态
    showIconPreview.value = false;
  }
});
</script>

<style scoped>
/* ============================================================
   遮罩层
   ============================================================ */
.icon-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============================================================
   对话框主体
   ============================================================ */
.icon-dialog {
  width: 600rpx;
  max-height: 85vh;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 40rpx 30rpx 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-title {
  font-size: 36rpx;
  font-weight: 600;
  text-align: center;
  margin-bottom: 30rpx;
  color: #333;
  flex-shrink: 0;
}

/* ============================================================
   图标分类标签
   ============================================================ */
.icon-tabs {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20rpx;
  border-bottom: 2rpx solid #eee;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  flex-shrink: 0;
}

.icon-tabs::-webkit-scrollbar {
  display: none;
}

.icon-tab {
  font-size: 28rpx;
  color: #666;
  padding: 12rpx 20rpx;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
}

.icon-tab.active {
  color: #333;
  font-weight: 600;
}

.icon-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #FFD700;
  border-radius: 2rpx;
}

/* ============================================================
   图标网格
   ============================================================ */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 10rpx;
  min-height: 300rpx;
}

.icon-grid::-webkit-scrollbar {
  width: 6rpx;
}

.icon-grid::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3rpx;
}

.icon-grid::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}

.icon-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 16rpx;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.icon-item.selected {
  background-color: #FFE57F;
  box-shadow: 0 4rpx 12rpx rgba(255, 215, 0, 0.3);
}

.icon-emoji {
  font-size: 48rpx;
}

/* ============================================================
   底部按钮
   ============================================================ */
.dialog-buttons {
  display: flex;
  gap: 20rpx;
  flex-shrink: 0;
  margin-top: auto;
}

.dialog-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 500;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.save-btn {
  background-color: #333;
  color: #fff;
}

/* ============================================================
   图标预览弹窗
   ============================================================ */
.icon-preview-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-preview-dialog {
  width: 500rpx;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  position: relative;
}

.preview-hint {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  font-size: 24rpx;
  color: #999;
}

.preview-icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 40rpx 0;
  position: relative;
}

.preview-icon {
  font-size: 120rpx;
}

.preview-tag {
  position: absolute;
  bottom: -10rpx;
  right: 140rpx;
  background-color: #666;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.preview-name {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 30rpx;
}

/* 选择按钮 */
.preview-select-btn {
  width: 80%;
  height: 70rpx;
  background-color: #333;
  border-radius: 35rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 40rpx;
  cursor: pointer;
}

.select-btn-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

.preview-close {
  position: absolute;
  bottom: -30rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 3rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #fff;
}

.close-icon {
  font-size: 32rpx;
  color: #666;
}

/* ============================================================
   使用教程弹窗
   ============================================================ */
.tutorial-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tutorial-dialog {
  width: 600rpx;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 教程演示区域 */
.tutorial-demo {
  width: 100%;
  margin-bottom: 30rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16/14;
}

.tutorial-video {
  width: 200%;
  height: 500%;
  display: block;
  object-fit: contain;
}

/* 教程内容 */
.tutorial-content {
  width: 100%;
  text-align: center;
  margin-bottom: 30rpx;
}

.tutorial-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 15rpx;
}

.tutorial-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

/* 知道了按钮 */
.tutorial-button {
  width: 100%;
  height: 80rpx;
  background-color: #333;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.tutorial-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 500;
}
</style>
