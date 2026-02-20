<template>
  <!--
    WheelPicker - 通用底部 Sheet 单列滚轮选择器
    对应设计图 29.jpg（月份）、30.jpg（日期）、31.jpg（间隔年数）
    底部白色半屏 Sheet，左侧 ▶ 标记选中行，选中项大号加粗黑字+灰底矩形

    Props:
      visible   Boolean   是否显示
      items     Array     选项列表，元素为数字或字符串
      value     Number    当前选中项的索引（items 数组下标）
      suffix    String    右侧固定标签（如 '月'、'日'、'年重复'）
      prefix    String    左侧固定标签（如 '每'），可选
    Emits:
      confirm(index)   确定，传选中索引
      cancel           取消
  -->
  <view v-if="visible" class="wp-mask" @tap.stop="onCancel">
    <view class="wp-sheet" @tap.stop>

      <!-- 滚轮区域 -->
      <view class="wp-wheel-area">

        <!-- 左侧前缀标签（如 "每"） -->
        <text v-if="prefix" class="wp-prefix">{{ prefix }}</text>

        <!-- ▶ 选中指示器 -->
        <text class="wp-pointer">▶</text>

        <!-- 滚轮列表 -->

        <!-- #ifdef H5 -->
        <!-- H5：静态模拟滚轮 + 点击触发原生 picker -->
        <picker
          mode="selector"
          :range="items"
          :value="tempIndex"
          @change="onH5PickerChange"
          class="wp-picker-h5"
        >
          <view class="wp-picker-h5-display">
            <!-- 选中项灰底 -->
            <view class="wp-item-selected-bg-h5"></view>
            <!-- 上方2项 -->
            <view class="wp-item">
              <text class="wp-item-text wp-item-text-fade">{{ items[tempIndex - 2] !== undefined ? items[tempIndex - 2] : '' }}</text>
            </view>
            <view class="wp-item">
              <text class="wp-item-text wp-item-text-near">{{ items[tempIndex - 1] !== undefined ? items[tempIndex - 1] : '' }}</text>
            </view>
            <!-- 选中项 -->
            <view class="wp-item">
              <text class="wp-item-text wp-item-text-active">{{ items[tempIndex] !== undefined ? items[tempIndex] : '' }}</text>
            </view>
            <!-- 下方2项 -->
            <view class="wp-item">
              <text class="wp-item-text wp-item-text-near">{{ items[tempIndex + 1] !== undefined ? items[tempIndex + 1] : '' }}</text>
            </view>
            <view class="wp-item">
              <text class="wp-item-text wp-item-text-fade">{{ items[tempIndex + 2] !== undefined ? items[tempIndex + 2] : '' }}</text>
            </view>
          </view>
        </picker>
        <!-- #endif -->

        <!-- #ifndef H5 -->
        <!-- App：scroll-view 滚轮 -->
        <view class="wp-scroll-container">
          <!-- 选中高亮背景 -->
          <view class="wp-item-selected-bg"></view>
          <scroll-view
            class="wp-scroll"
            scroll-y
            :scroll-top="scrollTop"
            @scroll="onScroll"
            @scrollend="onScrollEnd"
          >
            <!-- 上下各留2个空位，让首尾项能滚到中间 -->
            <view class="wp-pad"></view>
            <view class="wp-pad"></view>
            <view
              v-for="(item, idx) in items"
              :key="idx"
              class="wp-item"
              :class="{ 'wp-item-center': idx === tempIndex }"
            >
              <text
                class="wp-item-text"
                :class="getItemClass(idx)"
              >{{ item }}</text>
            </view>
            <view class="wp-pad"></view>
            <view class="wp-pad"></view>
          </scroll-view>
        </view>
        <!-- #endif -->

        <!-- 右侧后缀标签 -->
        <text class="wp-suffix">{{ suffix }}</text>
      </view>

      <!-- 底部取消/确定 -->
      <view class="wp-btns">
        <view class="wp-btn-cancel" @tap="onCancel">
          <text class="wp-btn-text">取消</text>
        </view>
        <view class="wp-btn-confirm" @tap="onConfirm">
          <text class="wp-btn-text wp-btn-confirm-text">确定</text>
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
  visible: { type: Boolean, default: false },
  items:   { type: Array,   default: () => [] },
  value:   { type: Number,  default: 0 },
  suffix:  { type: String,  default: '' },
  prefix:  { type: String,  default: '' }
});

const emit = defineEmits(['confirm', 'cancel']);

// ============================================================
// 内部状态
// ============================================================

/** 临时选中索引 */
const tempIndex = ref(0);

/** 每项高度 px（88rpx，按 750rpx 基准 ≈ 44px） */
const ITEM_H = 44;

/** App端 scroll-top */
const scrollTop = ref(0);

/** 打开时初始化 */
watch(() => props.visible, (val) => {
  if (!val) return;
  tempIndex.value = props.value ?? 0;
  // 延迟设置 scrollTop，确保 DOM 渲染完成
  setTimeout(() => {
    scrollTop.value = tempIndex.value * ITEM_H;
  }, 50);
});

// ============================================================
// App端：scroll-view 滚动
// ============================================================
let scrollTimer = null;

function onScroll(e) {
  const top = e.detail.scrollTop;
  // 防抖：滚动停止后再 snap
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    const idx = Math.round(top / ITEM_H);
    tempIndex.value = Math.max(0, Math.min(props.items.length - 1, idx));
    scrollTop.value = tempIndex.value * ITEM_H;
  }, 150);
}

function onScrollEnd(e) {
  const top = e.detail.scrollTop;
  const idx = Math.round(top / ITEM_H);
  tempIndex.value = Math.max(0, Math.min(props.items.length - 1, idx));
  scrollTop.value = tempIndex.value * ITEM_H;
}

/** 距离选中项的级数，用于决定字体大小和透明度 */
function getItemClass(idx) {
  const diff = Math.abs(idx - tempIndex.value);
  if (diff === 0) return 'wp-item-text-active';
  if (diff === 1) return 'wp-item-text-near';
  return 'wp-item-text-fade';
}

// ============================================================
// H5端：picker change
// ============================================================
function onH5PickerChange(e) {
  tempIndex.value = Number(e.detail.value);
}

// ============================================================
// 取消 / 确定
// ============================================================
function onCancel() {
  emit('cancel');
}

function onConfirm() {
  emit('confirm', tempIndex.value);
}
</script>

<style scoped>
/* ============================================================
   遮罩：半透明，点击关闭
   ============================================================ */
.wp-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.35);
  z-index: 1200;
  display: flex;
  align-items: flex-end;
}

/* ============================================================
   底部白色半屏 Sheet（无顶部圆角背景，纯白）
   ============================================================ */
.wp-sheet {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding-top: 16rpx;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: border-box;
}

/* ============================================================
   滚轮区域
   ============================================================ */
.wp-wheel-area {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 440rpx;  /* 5项可视高度：5×88rpx */
  position: relative;
  padding: 0 40rpx;
}

/* 左侧前缀 */
.wp-prefix {
  font-size: 36rpx;
  color: #333;
  margin-right: 24rpx;
  flex-shrink: 0;
}

/* ▶ 选中指示器 */
.wp-pointer {
  font-size: 28rpx;
  color: #333;
  margin-right: 8rpx;
  flex-shrink: 0;
}

/* 右侧后缀 */
.wp-suffix {
  font-size: 36rpx;
  color: #333;
  margin-left: 24rpx;
  flex-shrink: 0;
}

/* ============================================================
   App端：scroll-view 滚轮
   ============================================================ */
.wp-scroll-container {
  position: relative;
  width: 220rpx;
  height: 440rpx;
  overflow: hidden;
}

/* 选中项灰底矩形（绝对定位在中间） */
.wp-item-selected-bg {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 88rpx;
  background-color: #F0F0F0;
  border-radius: 12rpx;
  pointer-events: none;
  z-index: 1;
}

.wp-scroll {
  width: 100%;
  height: 440rpx;
  position: relative;
  z-index: 2;
}

/* 上下各两个填充行，让首尾项能居中 */
.wp-pad {
  height: 88rpx;
}

/* 通用列表项 */
.wp-item {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 选中项文字 */
.wp-item-text {
  text-align: center;
  font-size: 28rpx;
  color: #CCCCCC;
  transition: font-size 0.1s, color 0.1s;
}

.wp-item-text-active {
  font-size: 56rpx;
  color: #111111;
  font-weight: bold;
}

.wp-item-text-near {
  font-size: 36rpx;
  color: #888888;
}

.wp-item-text-fade {
  font-size: 28rpx;
  color: #CCCCCC;
}

/* ============================================================
   H5端：picker 包装
   ============================================================ */
.wp-picker-h5 {
  width: 220rpx;
  height: 440rpx;
}

.wp-picker-h5-display {
  position: relative;
  width: 220rpx;
  height: 440rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* H5 选中项灰底矩形（绝对定位居中） */
.wp-item-selected-bg-h5 {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 88rpx;
  background-color: #F0F0F0;
  border-radius: 12rpx;
  pointer-events: none;
  z-index: 0;
}

/* H5 端各项文字层级要在灰底之上 */
.wp-picker-h5-display .wp-item {
  position: relative;
  z-index: 1;
}

.wp-item-center {
  /* App端选中项额外标记，用于 getItemClass 逻辑 */
}

/* ============================================================
   底部取消/确定按钮
   ============================================================ */
.wp-btns {
  display: flex;
  flex-direction: row;
  border-top: 1rpx solid #F0F0F0;
}

.wp-btn-cancel {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1rpx solid #F0F0F0;
}

.wp-btn-confirm {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wp-btn-text {
  font-size: 32rpx;
  color: #666;
}

.wp-btn-confirm-text {
  color: #222222;
  font-weight: bold;
}
</style>
