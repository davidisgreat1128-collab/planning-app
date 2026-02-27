<template>
  <view class="create-plan-page">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-left" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="nav-title">{{ isEditMode ? '编辑规划' : '新规划' }}</text>
      <view class="nav-right"></view>
    </view>

    <!-- 滚动内容区 -->
    <scroll-view class="scroll-content" scroll-y>
      <!-- 规划名称 -->
      <view class="form-section">
        <text class="form-label">规划名称</text>
        <view class="input-wrapper">
          <view class="input-icon-clickable" @tap="openIconDialog">
            <text class="input-icon">{{ planForm.iconEmoji || '🔔' }}</text>
          </view>
          <input
            class="form-input"
            v-model="planForm.title"
            placeholder="循序渐进养成良好作息"
            placeholder-class="input-placeholder"
            maxlength="20"
          />
          <text class="char-count">{{ planForm.title.length }}/20</text>
        </view>
      </view>

      <!-- Buff -->
      <view class="form-section">
        <view class="form-label-row">
          <text class="form-label">Buff</text>
          <view class="change-buff-btn" @tap="changeBuff">
            <text class="buff-icon">📦</text>
            <text class="buff-text">换一个</text>
          </view>
        </view>
        <view class="buff-input-wrapper">
          <input
            class="buff-input"
            v-model="planForm.buff"
            placeholder="输入激励语"
            placeholder-class="input-placeholder"
          />
        </view>
      </view>

      <!-- 规划期限 -->
      <view class="form-section">
        <text class="form-label">规划期限</text>
        <view class="date-range-wrapper">
          <view class="date-display">
            <text class="date-text">{{ planForm.startDate }}-{{ planForm.endDate || '请选择' }}</text>
            <text class="clear-icon" @tap="clearDates">⊗</text>
          </view>

          <view class="date-detail">
            <picker mode="date" :value="pickerStartDate" @change="onStartDateChange" class="date-picker-wrapper">
              <view class="date-item">
                <text class="date-label">开始日期</text>
                <view class="date-value-wrapper">
                  <text class="date-value">{{ planForm.startDate }} {{ planForm.startWeekday }}</text>
                </view>
                <text class="date-hint">{{ planForm.startHint }}</text>
              </view>
            </picker>
            <picker mode="date" :value="pickerEndDate" @change="onEndDateChange" class="date-picker-wrapper">
              <view class="date-item">
                <text class="date-label">结束日期</text>
                <view class="date-value-wrapper">
                  <text class="date-value" :class="{ 'date-placeholder': !planForm.endDate }">
                    {{ planForm.endDate ? `${planForm.endDate} ${planForm.endWeekday}` : '请选择' }}
                  </text>
                </view>
                <text class="date-hint">{{ planForm.duration }}</text>
              </view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 里程碑 -->
      <view class="form-section">
        <view class="form-label-row">
          <text class="form-label">里程碑</text>
          <text class="form-hint">建议拆解规划，为规划设立阶段里程碑</text>
          <text class="add-milestone-btn" @tap="addMilestone">+添加</text>
        </view>

        <view
          v-for="(milestone, index) in planForm.milestones"
          :key="index"
          class="milestone-card"
        >
          <view class="milestone-header">
            <view class="milestone-number">{{ index + 1 }}</view>
            <input
              class="milestone-title-input"
              v-model="milestone.title"
              placeholder="里程碑标题"
            />
            <text class="milestone-edit-icon" @tap="editMilestone(index)">✏️</text>
          </view>

          <textarea
            class="milestone-desc-input"
            v-model="milestone.description"
            placeholder="输入里程碑描述..."
            :auto-height="true"
          />

          <view class="milestone-date">
            <text class="date-text">{{ milestone.date }} · {{ milestone.days }}</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-spacer"></view>
    </scroll-view>

    <!-- 底部创建/更新按钮 -->
    <view class="bottom-action">
      <view class="create-btn" @tap="submitPlan">
        <text class="btn-text">{{ submitButtonText }}</text>
      </view>
    </view>

    <!-- 里程碑弹窗 -->
    <milestone-modal
      v-model:visible="showMilestoneModal"
      :milestone-number="planForm.milestones.length + 1"
      :edit-data="editingMilestone"
      @save="handleMilestoneSave"
    />

    <!-- 图标选择弹窗 -->
    <plan-icon-dialog
      v-model:visible="showIconDialog"
      :initial-icon="planForm.icon"
      @save="handleIconSave"
    />
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { getRandomBuff } from '@/utils/buffLibrary.js';
import { getTemplateById } from '@/utils/templateDatabase.js';
import { usePlanStore } from '@/store/plan.js';
import MilestoneModal from '@/components/milestone-modal.vue';
import PlanIconDialog from '@/components/planning/PlanIconDialog.vue';

// 获取planStore
const planStore = usePlanStore();

// 模板ID（从URL参数获取）
const templateId = ref(null);
// 模板数据
const templateData = ref(null);

// 编辑模式相关
const isEditMode = ref(false); // 是否为编辑模式
const editingPlanId = ref(null); // 正在编辑的规划ID
const originalFormData = ref(null); // 原始表单数据（用于检测变化）
const hasFormChanged = ref(false); // 表单是否有变化

// 图标选择弹窗状态
const showIconDialog = ref(false);

// 表单数据（初始为空，等待模板数据或使用默认值）
const planForm = ref({
  title: '',
  buff: '',
  icon: '', // 图标ID
  iconEmoji: '🔔', // 图标emoji（默认铃铛）
  startDate: '',
  startWeekday: '',
  startHint: '',
  endDate: '',
  endWeekday: '',
  duration: '',
  milestones: []
});

// 日期格式转换：将 yyyy/MM/dd 转为 yyyy-MM-dd（用于picker组件）
const pickerStartDate = computed(() => {
  return planForm.value.startDate.replace(/\//g, '-');
});

const pickerEndDate = computed(() => {
  return planForm.value.endDate.replace(/\//g, '-');
});

// 提交按钮文字（根据模式和表单变化动态显示）
const submitButtonText = computed(() => {
  if (isEditMode.value) {
    return hasFormChanged.value ? '更新规划' : '编辑规划';
  }
  return '创建规划';
});

// 里程碑弹窗显示状态
const showMilestoneModal = ref(false);

// 正在编辑的里程碑
const editingMilestone = ref(null);
const editingMilestoneIndex = ref(-1);

// 打开图标选择弹窗
function openIconDialog() {
  showIconDialog.value = true;
}

// 保存图标
function handleIconSave(iconData) {
  planForm.value.icon = iconData.icon;
  planForm.value.iconEmoji = iconData.iconEmoji;
}

// 换一个Buff
function changeBuff() {
  planForm.value.buff = getRandomBuff();
}

// 清除日期
function clearDates() {
  planForm.value.startDate = '';
  planForm.value.endDate = '';
}

// 开始日期变更
function onStartDateChange(e) {
  const selectedDate = e.detail.value;
  planForm.value.startDate = selectedDate.replace(/-/g, '/');
  calculateDateInfo();
}

// 结束日期变更
function onEndDateChange(e) {
  const selectedDate = e.detail.value;
  planForm.value.endDate = selectedDate.replace(/-/g, '/');
  calculateDateInfo();
}

// 计算日期相关信息
function calculateDateInfo() {
  if (!planForm.value.startDate || !planForm.value.endDate) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(planForm.value.startDate);
  const endDate = new Date(planForm.value.endDate);

  // 计算开始日期的星期几
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  planForm.value.startWeekday = weekdays[startDate.getDay()];
  planForm.value.endWeekday = weekdays[endDate.getDay()];

  // 计算开始日期与今天的差异
  const diffDays = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    planForm.value.startHint = '今天';
  } else if (diffDays === 1) {
    planForm.value.startHint = '明天';
  } else if (diffDays === -1) {
    planForm.value.startHint = '昨天';
  } else if (diffDays > 1) {
    planForm.value.startHint = `${diffDays}天后`;
  } else if (diffDays < -1) {
    planForm.value.startHint = `${Math.abs(diffDays)}天前`;
  }

  // 计算持续天数（结束日期 - 开始日期 + 1）
  const durationDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  planForm.value.duration = `持续${durationDays}天`;

  console.log('[CreatePlan] 日期更新:', {
    startHint: planForm.value.startHint,
    duration: planForm.value.duration
  });
}

// 添加里程碑
function addMilestone() {
  console.log('[CreatePlan] 添加里程碑');
  editingMilestone.value = null;
  editingMilestoneIndex.value = -1;
  showMilestoneModal.value = true;
}

// 编辑里程碑
function editMilestone(index) {
  console.log('[CreatePlan] 编辑里程碑:', index);
  editingMilestone.value = { ...planForm.value.milestones[index] };
  editingMilestoneIndex.value = index;
  showMilestoneModal.value = true;
}

// 保存里程碑
function handleMilestoneSave(milestoneData) {
  console.log('[CreatePlan] 保存里程碑:', milestoneData);

  // 计算第几天（基于规划时间）
  let days = '第X天';
  if (planForm.value.startDate && milestoneData.date) {
    const startDate = new Date(planForm.value.startDate);
    const milestoneDate = new Date(milestoneData.date);
    const diffDays = Math.floor((milestoneDate - startDate) / (1000 * 60 * 60 * 24));
    days = `第${diffDays}天`;
  }

  const newMilestone = {
    title: milestoneData.title,
    description: milestoneData.description,
    date: milestoneData.date,
    days: days
  };

  if (editingMilestoneIndex.value >= 0) {
    // 编辑模式：更新现有里程碑
    planForm.value.milestones[editingMilestoneIndex.value] = newMilestone;
    uni.showToast({
      title: '更新成功',
      icon: 'success'
    });
  } else {
    // 新增模式：添加到列表
    planForm.value.milestones.push(newMilestone);
    uni.showToast({
      title: '添加成功',
      icon: 'success'
    });
  }

  // 重置编辑状态
  editingMilestone.value = null;
  editingMilestoneIndex.value = -1;
}

// 加载规划数据（编辑模式）
function loadPlanData(planId) {
  console.log('[CreatePlan] 加载规划数据，ID:', planId);

  // 从planStore中获取规划数据
  const plan = planStore.getPlanById(planId);

  if (!plan) {
    uni.showToast({
      title: '规划不存在',
      icon: 'error'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    return;
  }

  // 填充表单数据
  planForm.value = {
    title: plan.title || '',
    buff: plan.buff || '',
    icon: plan.icon || '',
    iconEmoji: plan.iconEmoji || '🔔',
    startDate: plan.startDate || '',
    startWeekday: plan.startWeekday || '',
    startHint: plan.startHint || '',
    endDate: plan.endDate || '',
    endWeekday: plan.endWeekday || '',
    duration: plan.duration || '',
    milestones: plan.milestones ? JSON.parse(JSON.stringify(plan.milestones)) : []
  };

  // 保存原始数据（用于检测变化）
  originalFormData.value = JSON.parse(JSON.stringify(planForm.value));

  console.log('[CreatePlan] 规划数据已加载');
}

// 提交规划（创建或更新）
function submitPlan() {
  if (isEditMode.value) {
    updatePlan();
  } else {
    createPlan();
  }
}

// 创建规划
function createPlan() {
  console.log('[CreatePlan] 创建规划:', planForm.value);

  // 验证必填项
  if (!planForm.value.title.trim()) {
    uni.showToast({
      title: '请输入规划名称',
      icon: 'none'
    });
    return;
  }

  if (!planForm.value.startDate || !planForm.value.endDate) {
    uni.showToast({
      title: '请选择规划期限',
      icon: 'none'
    });
    return;
  }

  // 使用planStore创建规划
  const newPlan = planStore.addPlan({
    title: planForm.value.title,
    buff: planForm.value.buff,
    icon: planForm.value.icon,
    iconEmoji: planForm.value.iconEmoji || '🔔',
    startDate: planForm.value.startDate,
    endDate: planForm.value.endDate,
    duration: planForm.value.duration,
    milestones: planForm.value.milestones || []
  });

  const newPlanId = newPlan.id;

  console.log('[CreatePlan] 规划已创建:', newPlan);

  // 同时将规划作为分类保存到user_categories（用于分类选择器）
  const savedCategories = uni.getStorageSync('user_categories');
  let categories = [];
  if (savedCategories) {
    try {
      categories = JSON.parse(savedCategories);
    } catch (e) {
      console.error('[CreatePlan] 解析分类失败:', e);
    }
  }

  // 添加到分类列表
  categories.push({
    id: newPlanId,
    type: 'plan',
    name: planForm.value.title,
    iconEmoji: planForm.value.iconEmoji || '🔔',
    createTime: new Date().toISOString(),
    buff: planForm.value.buff,
    startDate: planForm.value.startDate,
    endDate: planForm.value.endDate,
    milestones: planForm.value.milestones || []
  });
  uni.setStorageSync('user_categories', JSON.stringify(categories));

  console.log('[CreatePlan] 规划已同步到分类列表');

  // 如果是从模板创建，需要根据模板的tasksByDay创建对应的任务
  if (templateId.value && templateData.value && templateData.value.tasksByDay) {
    console.log('[CreatePlan] 从模板创建任务，模板ID:', templateId.value);
    createTasksFromTemplate(newPlanId, templateData.value);
  }

  uni.showToast({
    title: '创建成功',
    icon: 'success'
  });

  // 跳转到规划详情页
  setTimeout(() => {
    uni.redirectTo({
      url: `/pages/planning/plan/detail?id=${newPlanId}`
    });
  }, 1500);
}

// 从模板创建任务
function createTasksFromTemplate(planId, template) {
  console.log('[CreatePlan] 开始从模板创建任务');

  // 加载现有任务
  const savedTasks = uni.getStorageSync('tasks');
  let tasks = [];
  if (savedTasks) {
    try {
      tasks = JSON.parse(savedTasks);
    } catch (e) {
      console.error('[CreatePlan] 解析任务失败:', e);
    }
  }

  const startDate = new Date(planForm.value.startDate.replace(/\//g, '-'));
  const endDate = new Date(planForm.value.endDate.replace(/\//g, '-'));
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  let createdTaskCount = 0;
  let currentDayTasks = []; // 当前使用的任务模板

  // 为每一天创建任务（从第1天到最后一天）
  for (let dayIndex = 1; dayIndex <= totalDays; dayIndex++) {
    // 检查这一天是否有特定的任务定义
    if (template.tasksByDay[dayIndex]) {
      // 使用这一天的任务定义
      currentDayTasks = template.tasksByDay[dayIndex];
      console.log(`[CreatePlan] 第${dayIndex}天使用新任务模板:`, currentDayTasks.length, '个任务');
    } else if (currentDayTasks.length === 0 && dayIndex === 1) {
      // 如果第1天没有定义，尝试使用day1的任务，或者跳过
      console.warn(`[CreatePlan] 模板没有定义第${dayIndex}天的任务，跳过`);
      continue;
    }
    // 否则继续使用上一天的任务模板（延续重复任务）

    // 计算该天的实际日期
    const taskDate = new Date(startDate);
    taskDate.setDate(taskDate.getDate() + (dayIndex - 1));
    const taskDateStr = formatDate(taskDate);

    // 为该天创建任务
    currentDayTasks.forEach((taskTemplate, index) => {
      const newTask = {
        id: `task_${Date.now()}_${dayIndex}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        title: taskTemplate.title,
        date: taskDateStr,
        occurDate: taskDateStr,
        categoryId: planId, // 关联到规划
        iconEmoji: planForm.value.iconEmoji || '🔔',
        status: 'pending',
        isUrgent: taskTemplate.isUrgent !== undefined ? taskTemplate.isUrgent : false,
        isImportant: taskTemplate.isImportant !== undefined ? taskTemplate.isImportant : true,
        isRecurring: taskTemplate.isRepeat || false,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      };

      tasks.push(newTask);
      createdTaskCount++;
    });
  }

  // 保存任务
  uni.setStorageSync('tasks', JSON.stringify(tasks));
  console.log(`[CreatePlan] 成功创建 ${createdTaskCount} 个任务，共 ${totalDays} 天`);

  uni.showToast({
    title: `已创建${createdTaskCount}个任务`,
    icon: 'success',
    duration: 2000
  });
}

// 更新规划
function updatePlan() {
  console.log('[CreatePlan] 更新规划:', planForm.value);

  // 验证必填项
  if (!planForm.value.title.trim()) {
    uni.showToast({
      title: '请输入规划名称',
      icon: 'none'
    });
    return;
  }

  if (!planForm.value.startDate || !planForm.value.endDate) {
    uni.showToast({
      title: '请选择规划期限',
      icon: 'none'
    });
    return;
  }

  // 使用planStore更新规划
  const success = planStore.updatePlan(editingPlanId.value, {
    title: planForm.value.title,
    buff: planForm.value.buff,
    icon: planForm.value.icon,
    iconEmoji: planForm.value.iconEmoji || '🔔',
    startDate: planForm.value.startDate,
    endDate: planForm.value.endDate,
    duration: planForm.value.duration,
    milestones: planForm.value.milestones || []
  });

  if (success) {
    console.log('[CreatePlan] 规划已更新');

    // 同步更新分类列表中的规划信息
    const savedCategories = uni.getStorageSync('user_categories');
    let categories = [];
    if (savedCategories) {
      try {
        categories = JSON.parse(savedCategories);
        const index = categories.findIndex(cat => cat.id === editingPlanId.value);
        if (index !== -1) {
          categories[index] = {
            ...categories[index],
            name: planForm.value.title,
            iconEmoji: planForm.value.iconEmoji || '🔔',
            buff: planForm.value.buff,
            startDate: planForm.value.startDate,
            endDate: planForm.value.endDate,
            milestones: planForm.value.milestones || []
          };
          uni.setStorageSync('user_categories', JSON.stringify(categories));
        }
      } catch (e) {
        console.error('[CreatePlan] 更新分类失败:', e);
      }
    }

    uni.showToast({
      title: '规划已更新',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } else {
    uni.showToast({
      title: '更新失败',
      icon: 'error'
    });
  }
}

// 返回
function goBack() {
  uni.navigateBack();
}

// 监听表单变化（深度监听）
watch(
  () => planForm.value,
  (newVal) => {
    if (isEditMode.value && originalFormData.value) {
      // 比较当前表单数据和原始数据
      hasFormChanged.value = JSON.stringify(newVal) !== JSON.stringify(originalFormData.value);
    }
  },
  { deep: true }
);

// 页面加载时计算日期信息和加载模板数据
onMounted(() => {
  // 获取URL参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};

  // 检查是否为编辑模式
  if (options.mode === 'edit' && options.id) {
    isEditMode.value = true;
    editingPlanId.value = options.id;
    console.log('[CreatePlan] 编辑模式，规划ID:', editingPlanId.value);

    // 加载现有规划数据
    loadPlanData(editingPlanId.value);
    return; // 编辑模式下直接返回，不执行下面的模板创建逻辑
  }

  // 检查是否从模板创建
  if (options.templateId) {
    templateId.value = options.templateId;
    console.log('[CreatePlan] 从模板创建规划，模板ID:', templateId.value);

    // 加载模板数据
    templateData.value = getTemplateById(templateId.value);

    if (templateData.value) {
      console.log('[CreatePlan] 模板数据已加载:', templateData.value);

      // 使用模板数据填充表单
      planForm.value.title = templateData.value.title;
      planForm.value.buff = templateData.value.buff;
      planForm.value.iconEmoji = templateData.value.iconEmoji || '🔔';

      // 计算日期：从今天开始，持续模板指定的天数
      const today = new Date();
      const startDate = new Date(today);
      planForm.value.startDate = formatDate(startDate);

      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + (templateData.value.duration - 1));
      planForm.value.endDate = formatDate(endDate);

      // 加载里程碑
      if (templateData.value.milestones && templateData.value.milestones.length > 0) {
        planForm.value.milestones = templateData.value.milestones.map((milestone, index) => {
          // 计算里程碑日期（基于模板的天数）
          const dayMatch = milestone.days.match(/第(\d+)天/);
          let milestoneDate = startDate;
          if (dayMatch) {
            const dayNumber = parseInt(dayMatch[1]);
            milestoneDate = new Date(startDate);
            milestoneDate.setDate(milestoneDate.getDate() + dayNumber);
          }

          return {
            title: milestone.title,
            description: milestone.description,
            date: formatDate(milestoneDate),
            days: milestone.days
          };
        });
      }

      uni.showToast({
        title: '模板已加载',
        icon: 'success',
        duration: 1500
      });
    } else {
      console.warn('[CreatePlan] 未找到模板数据');
      uni.showToast({
        title: '模板不存在',
        icon: 'none'
      });
    }
  } else {
    // 非模板创建，使用默认值
    console.log('[CreatePlan] 普通创建规划，使用默认值');

    planForm.value.title = ''; // 空白标题
    planForm.value.buff = getRandomBuff();
    planForm.value.iconEmoji = '🔔';

    // 默认日期：开始日期为今天，结束日期为空
    const today = new Date();
    planForm.value.startDate = formatDate(today);
    planForm.value.endDate = ''; // 结束日期为空，需要用户选择

    planForm.value.milestones = [];
  }

  calculateDateInfo();
});

// 格式化日期为 yyyy/MM/dd
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
</script>

<style scoped>
.create-plan-page {
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
   表单区域
   ============================================================ */
.form-section {
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.form-label-row {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.form-hint {
  font-size: 24rpx;
  color: #999;
  flex: 1;
}

/* 规划名称输入 */
.input-wrapper {
  background-color: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 25rpx;
  display: flex;
  align-items: center;
  gap: 15rpx;
  width: 100%;
  box-sizing: border-box;
}

.input-icon-clickable {
  cursor: pointer;
  transition: transform 0.2s;
}

.input-icon-clickable:active {
  transform: scale(1.1);
}

.input-icon {
  font-size: 40rpx;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  min-width: 0; /* 防止flex子元素溢出 */
}

.input-placeholder {
  color: #ccc;
}

.char-count {
  font-size: 24rpx;
  color: #999;
}

/* Buff输入 */
.change-buff-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  cursor: pointer;
  flex-shrink: 0;
}

.buff-icon {
  font-size: 28rpx;
}

.buff-text {
  font-size: 26rpx;
  color: #5B8CFF;
  white-space: nowrap;
}

.buff-input-wrapper {
  background-color: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 25rpx;
  width: 100%;
  box-sizing: border-box;
}

.buff-input {
  width: 100%;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

/* 日期范围 */
.date-range-wrapper {
  background-color: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 25rpx;
  width: 100%;
  box-sizing: border-box;
}

.date-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.date-text {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clear-icon {
  font-size: 32rpx;
  color: #999;
  cursor: pointer;
  flex-shrink: 0;
}

.date-detail {
  display: flex;
  gap: 15rpx;
  width: 100%;
}

.date-picker-wrapper {
  flex: 1;
  min-width: 0;
}

.date-item {
  flex: 1;
  min-width: 0; /* 防止溢出 */
  background-color: #f8f8f8;
  border-radius: 12rpx;
  padding: 15rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  box-sizing: border-box;
  cursor: pointer;
}

.date-label {
  font-size: 24rpx;
  color: #999;
}

.date-value-wrapper {
  cursor: pointer;
}

.date-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 600;
  word-break: break-all;
  line-height: 1.4;
}

.date-placeholder {
  color: #ccc;
  font-weight: 400;
}

.date-hint {
  font-size: 22rpx;
  color: #666;
}

/* 里程碑 */
.add-milestone-btn {
  font-size: 26rpx;
  color: #5B8CFF;
  cursor: pointer;
}

.milestone-card {
  background-color: #fff;
  border: 2rpx solid #333;
  border-radius: 16rpx;
  padding: 25rpx;
  margin-bottom: 20rpx;
}

.milestone-header {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 15rpx;
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

.milestone-title-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.milestone-edit-icon {
  font-size: 32rpx;
  cursor: pointer;
}

.milestone-desc-input {
  width: 100%;
  min-height: 120rpx;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  padding: 15rpx 0;
  border: none;
  background: transparent;
}

.milestone-date {
  padding-top: 15rpx;
  border-top: 1rpx dashed #e0e0e0;
}

.date-text {
  font-size: 24rpx;
  color: #999;
}

/* ============================================================
   底部按钮
   ============================================================ */
.bottom-spacer {
  height: 40rpx;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 60rpx 40rpx;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.create-btn {
  width: 100%;
  height: 90rpx;
  background-color: #333;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.btn-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
}
</style>
