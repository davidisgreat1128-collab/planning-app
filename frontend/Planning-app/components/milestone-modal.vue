<template>
  <view v-if="visible" class="modal-overlay" @tap="handleOverlayClick">
    <view class="modal-container" @tap.stop>
      <!-- 下拉指示器 -->
      <view class="modal-indicator">
        <view class="indicator-bar"></view>
      </view>

      <!-- 里程碑标题 -->
      <view class="form-section">
        <text class="form-label">里程碑 (必填)</text>
        <view class="milestone-input-wrapper">
          <view class="milestone-number">{{ milestoneNumber }}</view>
          <input
            class="milestone-input"
            v-model="formData.title"
            placeholder="例：达到xxxx阶段性结果"
            placeholder-class="input-placeholder"
            maxlength="50"
          />
        </view>
      </view>

      <!-- 备注 -->
      <view class="form-section">
        <text class="form-label">备注</text>
        <textarea
          class="note-textarea"
          v-model="formData.description"
          placeholder="1.可以写本阶段需要完成的计划类型；&#10;2.可以写达成本阶段结果需注意的事项；&#10;3.可以写达成该里程碑带来的好处；&#10;4.越详细明确，越能助力目标实现噢。"
          placeholder-class="input-placeholder"
          :auto-height="true"
          :maxlength="500"
        />
      </view>

      <!-- 里程碑时间点 -->
      <view class="form-section">
        <text class="form-label">里程碑时间点</text>
        <picker mode="date" :value="pickerDate" @change="onDateChange">
          <view class="date-input-wrapper">
            <input
              class="date-input"
              :value="formData.date"
              placeholder="设置里程碑时间点"
              placeholder-class="input-placeholder"
              disabled
            />
            <text class="calendar-icon">📅</text>
          </view>
        </picker>
      </view>

      <!-- 保存按钮 -->
      <view class="save-btn" @tap="handleSave">
        <text class="save-btn-text">保存</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  milestoneNumber: {
    type: Number,
    default: 1
  },
  // 用于编辑模式，传入现有里程碑数据
  editData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:visible', 'save']);

// 表单数据
const formData = ref({
  title: '',
  description: '',
  date: ''
});

// 用于 picker 的日期格式（yyyy-MM-dd）
const pickerDate = computed(() => {
  if (!formData.value.date) {
    return '';
  }
  return formData.value.date.replace(/\//g, '-');
});

// 监听编辑数据变化
watch(() => props.editData, (newData) => {
  if (newData) {
    formData.value = {
      title: newData.title || '',
      description: newData.description || '',
      date: newData.date || ''
    };
  } else {
    // 清空表单
    formData.value = {
      title: '',
      description: '',
      date: ''
    };
  }
}, { immediate: true });

// 监听弹窗显示状态
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    // 弹窗关闭时清空表单
    setTimeout(() => {
      if (!props.editData) {
        formData.value = {
          title: '',
          description: '',
          date: ''
        };
      }
    }, 300);
  }
});

// 日期选择
function onDateChange(e) {
  const selectedDate = e.detail.value;
  formData.value.date = selectedDate.replace(/-/g, '/');
}

// 点击遮罩层关闭
function handleOverlayClick() {
  emit('update:visible', false);
}

// 保存
function handleSave() {
  // 验证必填项
  if (!formData.value.title.trim()) {
    uni.showToast({
      title: '请输入里程碑标题',
      icon: 'none'
    });
    return;
  }

  if (!formData.value.date) {
    uni.showToast({
      title: '请选择里程碑时间点',
      icon: 'none'
    });
    return;
  }

  // 触发保存事件
  emit('save', { ...formData.value });

  // 关闭弹窗
  emit('update:visible', false);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.modal-container {
  width: 100%;
  background-color: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 20rpx 30rpx 60rpx;
  animation: slideUp 0.3s ease-out;
  max-height: 90vh;
  overflow-y: auto;
  box-sizing: border-box;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 下拉指示器 */
.modal-indicator {
  display: flex;
  justify-content: center;
  padding: 10rpx 0 20rpx;
}

.indicator-bar {
  width: 80rpx;
  height: 8rpx;
  background-color: #e0e0e0;
  border-radius: 4rpx;
}

/* 表单区域 */
.form-section {
  margin-bottom: 35rpx;
}

.form-label {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
}

/* 里程碑输入 */
.milestone-input-wrapper {
  display: flex;
  align-items: center;
  gap: 15rpx;
  background-color: #fff;
  border: 2rpx solid #333;
  border-radius: 16rpx;
  padding: 20rpx 25rpx;
  box-sizing: border-box;
}

.milestone-number {
  width: 48rpx;
  height: 48rpx;
  background-color: #333;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.milestone-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  min-width: 0;
}

.input-placeholder {
  color: #ccc;
}

/* 备注输入 */
.note-textarea {
  width: 100%;
  min-height: 200rpx;
  background-color: #fff;
  border: 2rpx solid #333;
  border-radius: 16rpx;
  padding: 20rpx 25rpx;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  box-sizing: border-box;
}

/* 日期输入 */
.date-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border: 2rpx solid #333;
  border-radius: 16rpx;
  padding: 20rpx 25rpx;
  box-sizing: border-box;
}

.date-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  min-width: 0;
}

.calendar-icon {
  font-size: 36rpx;
  flex-shrink: 0;
}

/* 保存按钮 */
.save-btn {
  width: 100%;
  height: 90rpx;
  background-color: #333;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.save-btn-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
}
</style>
