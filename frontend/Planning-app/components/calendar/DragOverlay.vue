<template>
  <!-- 拖拽蒙层（包含浮动任务副本 + 删除区域 + 对话框） -->
  <view v-if="dragState.dragging" class="drag-overlay-container">
    <!-- 半透明拖拽的任务副本 -->
    <view
      class="drag-task-preview"
      :style="{
        left: dragState.x + 'px',
        top: dragState.y + 'px'
      }"
    >
      <text class="drag-task-title">{{ dragState.task?.title || '拖拽中...' }}</text>
    </view>

    <!-- 删除区域 -->
    <view
      class="delete-zone"
      :class="{ 'delete-zone-active': dragState.overDelete }"
    >
      <view class="delete-zone-icon">🗑️</view>
      <text class="delete-zone-text">拖到此处删除</text>
    </view>
  </view>

  <!-- 重复任务象限切换对话框 -->
  <view
    v-if="showChangeQuadrantDialog"
    class="modal-overlay"
    @tap="closeChangeQuadrantDialog"
  >
    <view class="modal-content" @tap.stop>
      <text class="modal-title">选择更改范围</text>
      <view class="modal-options">
        <view
          class="modal-option"
          :class="{ active: changeQuadrantOption === 1 }"
          @tap="emit('update:changeQuadrantOption', 1)"
        >
          <text class="option-text">完整更改此条重复计划</text>
          <view v-if="changeQuadrantOption === 1" class="option-check">✓</view>
        </view>
        <view
          class="modal-option"
          :class="{ active: changeQuadrantOption === 2 }"
          @tap="emit('update:changeQuadrantOption', 2)"
        >
          <text class="option-text">{{ option2Text }}</text>
          <text class="option-hint">不影响过去记录</text>
          <view v-if="changeQuadrantOption === 2" class="option-check">✓</view>
        </view>
      </view>
      <view class="modal-actions">
        <text class="modal-btn modal-btn-cancel" @tap="closeChangeQuadrantDialog">取消</text>
        <text class="modal-btn modal-btn-confirm" @tap="confirmChangeQuadrant">确定</text>
      </view>
    </view>
  </view>

  <!-- 删除任务确认对话框 -->
  <DeleteTaskDialog
    v-model:show="showDeleteTaskDialog"
    v-model:selectedOption="deleteTaskOption"
    @confirm="handleDeleteConfirm"
  />
</template>

<script setup>
import { ref, computed, toRefs } from 'vue';
import DeleteTaskDialog from '@/components/DeleteTaskDialog.vue';

/**
 * DragOverlay - 拖拽蒙层组件
 *
 * 职责:
 * - 显示拖拽中的任务浮层
 * - 显示删除区域（拖拽到底部删除）
 * - 管理重复任务象限切换对话框
 * - 管理删除任务确认对话框
 *
 * 使用方式:
 * <DragOverlay
 *   :drag-state="dragDropComposable.dragState.value"
 *   :show-change-quadrant-dialog="quadrantComposable.showChangeQuadrantDialog.value"
 *   :change-quadrant-option="quadrantComposable.changeQuadrantOption.value"
 *   @update:changeQuadrantOption="quadrantComposable.changeQuadrantOption.value = $event"
 *   @confirm-change-quadrant="confirmChangeQuadrant"
 *   @confirm-delete="handleDeleteTaskConfirm"
 * />
 *
 * @author Claude Sonnet 4.5
 * @date 2026-03-06
 */

// Props
const props = defineProps({
  // 拖拽状态对象（来自useDragDrop）
  dragState: {
    type: Object,
    required: true,
    default: () => ({
      dragging: false,
      task: null,
      x: 0,
      y: 0,
      overDelete: false
    })
  },
  // 是否显示重复任务象限切换对话框
  showChangeQuadrantDialog: {
    type: Boolean,
    default: false
  },
  // 当前选中的象限切换选项（1=全部更改, 2=仅未来）
  changeQuadrantOption: {
    type: Number,
    default: 1
  },
  /**
   * 当前选中的日期（格式：YYYY-MM-DD）
   * 用于显示"更改X月X日及未来计划"文案
   */
  currentDate: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits([
  'update:changeQuadrantOption',
  'close-change-quadrant-dialog',
  'confirm-change-quadrant',
  'confirm-delete'
]);

// 内部状态（删除对话框）
const showDeleteTaskDialog = ref(false);
const deleteTaskOption = ref(1);

// Props 响应式解构
const { dragState, showChangeQuadrantDialog, changeQuadrantOption, currentDate } = toRefs(props);

/**
 * 计算选项2的文案（根据当前日期动态生成）
 * 示例：2026-03-17 → "更改17号及未来计划"
 */
const option2Text = computed(() => {
  if (!currentDate.value) {
    return '更改当天及未来计划'; // 兜底文案
  }

  // 解析日期：YYYY-MM-DD → 月份 + 日期
  const parts = currentDate.value.split('-');
  if (parts.length !== 3) {
    return '更改当天及未来计划'; // 格式错误时兜底
  }

  const month = parseInt(parts[1], 10); // 去掉前导0：03 → 3
  const day = parseInt(parts[2], 10);   // 去掉前导0：17 → 17

  return `更改${day}号及未来计划`;
});

/**
 * 关闭象限切换对话框
 */
function closeChangeQuadrantDialog() {
  emit('close-change-quadrant-dialog');
  emit('update:changeQuadrantOption', 1); // 重置选项
}

/**
 * 确认象限切换
 */
function confirmChangeQuadrant() {
  emit('confirm-change-quadrant', changeQuadrantOption.value);
}

/**
 * 处理删除确认
 * @param {number} option - 删除选项（1=仅当天, 2=完整清空, 3=删除未来）
 */
function handleDeleteConfirm(option) {
  emit('confirm-delete', option);
  // 关闭对话框
  showDeleteTaskDialog.value = false;
  deleteTaskOption.value = 1;
}

/**
 * 暴露方法供父组件调用
 */
defineExpose({
  /**
   * 显示删除任务对话框（由父组件调用）
   */
  showDeleteDialog() {
    showDeleteTaskDialog.value = true;
  }
});
</script>

<style scoped>
/* ============================================
   拖拽蒙层容器
   ============================================ */
.drag-overlay-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  pointer-events: none;
}

/* ============================================
   拖拽中的任务副本
   ============================================ */
.drag-task-preview {
  position: fixed;
  z-index: 10000;
  padding: 24rpx 32rpx;
  background: rgba(66, 133, 244, 0.95);
  border-radius: 16rpx;
  pointer-events: none;
  transform: translate(-50%, -50%);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
  border: 6rpx solid #FF4D4F;
  min-width: 200rpx;
  max-width: 500rpx;
}

.drag-task-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  display: block;
  word-break: break-all;
}

/* ============================================
   删除区域
   ============================================ */
.delete-zone {
  position: fixed;
  bottom: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  background: rgba(255, 77, 79, 0.15);
  border: 4rpx dashed #FF4D4F;
  border-radius: 50%;
  transition: all 0.3s ease;
  pointer-events: none;
}

.delete-zone-active {
  background: rgba(255, 77, 79, 0.35);
  border-color: #FF1744;
  border-width: 6rpx;
  transform: translateX(-50%) scale(1.15);
  box-shadow: 0 8rpx 32rpx rgba(255, 77, 79, 0.4);
}

.delete-zone-icon {
  font-size: 64rpx;
  margin-bottom: 8rpx;
  transition: transform 0.2s ease;
}

.delete-zone-active .delete-zone-icon {
  transform: scale(1.1);
}

.delete-zone-text {
  font-size: 24rpx;
  color: #FF4D4F;
  font-weight: 600;
}

/* ============================================
   重复任务象限切换对话框
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
}

.modal-content {
  width: 540rpx;
  max-width: 85vw;
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 36rpx 32rpx 32rpx;
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.25);
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 28rpx;
  text-align: center;
}

.modal-options {
  margin-bottom: 28rpx;
}

.modal-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  padding: 24rpx 64rpx 24rpx 24rpx;
  margin-bottom: 12rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.modal-option.active {
  background: rgba(89, 126, 247, 0.1);
  border-color: #597EF7;
}

.option-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 4rpx;
}

.option-hint {
  font-size: 22rpx;
  color: #999999;
}

.option-check {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #597EF7;
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
}

.modal-btn {
  flex: 1;
  padding: 22rpx;
  text-align: center;
  border-radius: 10rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.modal-btn-cancel {
  background: #F0F0F0;
  color: #666666;
}

.modal-btn-confirm {
  background: #597EF7;
  color: #FFFFFF;
}
</style>
