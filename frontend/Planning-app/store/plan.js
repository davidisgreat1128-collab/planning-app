import { defineStore } from 'pinia';

export const usePlanStore = defineStore('plan', {
  state: () => ({
    // 所有规划列表
    plans: [],
    // 当前选中的规划ID
    selectedPlanId: null,
    // 从规划生成的任务列表（临时方案，前端展示用）
    generatedTasks: []
  }),

  getters: {
    /**
     * 获取选中的规划
     */
    selectedPlan: (state) => {
      if (!state.selectedPlanId) return null;
      return state.plans.find(p => p.id === state.selectedPlanId);
    },

    /**
     * 获取所有激活的规划
     */
    activePlans: (state) => {
      return state.plans.filter(p => !p.isDeleted);
    },

    /**
     * 根据ID获取规划
     */
    getPlanById: (state) => (planId) => {
      return state.plans.find(p => p.id === planId);
    },

    /**
     * 获取指定日期的规划生成任务
     */
    getTasksByDate: (state) => (dateStr) => {
      // dateStr 格式：YYYY-MM-DD
      return state.generatedTasks.filter(t => t.date === dateStr);
    },

    /**
     * 获取所有规划生成的任务
     */
    allGeneratedTasks: (state) => {
      return state.generatedTasks;
    }
  },

  actions: {
    /**
     * 添加新规划
     */
    addPlan(planData) {
      const newPlan = {
        id: Date.now().toString(),
        title: planData.title,
        buff: planData.buff,
        startDate: planData.startDate,
        endDate: planData.endDate,
        duration: planData.duration,
        milestones: planData.milestones || [],
        createTime: new Date().toISOString(),
        isDeleted: false,
        isSelected: false,
        // 统计数据
        stats: {
          totalMilestones: planData.milestones?.length || 0,
          completedMilestones: 0,
          totalDays: this.calculateTotalDays(planData.startDate, planData.endDate),
          progressDays: this.calculateProgressDays(new Date().toISOString())
        }
      };

      this.plans.push(newPlan);
      this.savePlans();

      return newPlan;
    },

    /**
     * 更新规划
     */
    updatePlan(planId, updates) {
      const index = this.plans.findIndex(p => p.id === planId);
      if (index !== -1) {
        this.plans[index] = {
          ...this.plans[index],
          ...updates,
          updateTime: new Date().toISOString()
        };
        this.savePlans();
      }
    },

    /**
     * 删除规划
     * @param {string} planId - 规划ID
     * @param {boolean} deleteWithTasks - 是否同时删除关联的计划
     */
    deletePlan(planId, deleteWithTasks = false) {
      const index = this.plans.findIndex(p => p.id === planId);
      if (index !== -1) {
        this.plans[index].isDeleted = true;
        this.plans[index].deleteTime = new Date().toISOString();

        // 如果删除的是当前选中的规划，取消选中
        if (this.selectedPlanId === planId) {
          this.selectedPlanId = null;
          // 清空生成的任务
          this.generatedTasks = [];
        }

        this.savePlans();

        // TODO: 处理关联的计划（任务）
        if (deleteWithTasks) {
          // 删除该规划下的所有计划
          // 这里需要从任务列表中删除 planId === planId 的任务
          // 目前前端只有 generatedTasks，已在上面清空
          console.log('[PlanStore] 需要删除规划下的所有计划');
        } else {
          // 将该规划下的计划改为无分类
          // 这里需要将任务的 planId 设置为 null
          console.log('[PlanStore] 需要将规划下的计划改为无分类');
        }
      }
    },

    /**
     * 选择规划
     */
    selectPlan(planId) {
      // 取消所有规划的选中状态
      this.plans.forEach(p => {
        p.isSelected = false;
      });

      // 选中指定规划
      const plan = this.plans.find(p => p.id === planId);
      if (plan) {
        plan.isSelected = true;
        this.selectedPlanId = planId;
        this.savePlans();

        // 生成任务
        this.generateTasksFromPlan(plan);
      }
    },

    /**
     * 取消选中规划
     */
    deselectPlan() {
      this.plans.forEach(p => {
        p.isSelected = false;
      });
      this.selectedPlanId = null;
      this.savePlans();

      // 清空生成的任务
      this.generatedTasks = [];
    },

    /**
     * 切换规划选中状态
     */
    togglePlanSelection(planId) {
      const plan = this.plans.find(p => p.id === planId);
      if (!plan) return;

      if (plan.isSelected) {
        // 如果已选中，则取消选中
        this.deselectPlan();
      } else {
        // 如果未选中，则选中
        this.selectPlan(planId);
      }
    },

    /**
     * 更新里程碑完成状态
     */
    updateMilestoneCompletion(planId, milestoneIndex, isCompleted) {
      const plan = this.plans.find(p => p.id === planId);
      if (plan && plan.milestones[milestoneIndex]) {
        plan.milestones[milestoneIndex].isCompleted = isCompleted;

        // 重新计算完成的里程碑数量
        plan.stats.completedMilestones = plan.milestones.filter(m => m.isCompleted).length;

        this.savePlans();
      }
    },

    /**
     * 从规划生成任务
     * 临时方案：前端生成任务对象，不调用后端API
     */
    generateTasksFromPlan(plan) {
      if (!plan || !plan.milestones || plan.milestones.length === 0) {
        this.generatedTasks = [];
        return;
      }

      console.log('[PlanStore] 从规划生成任务:', plan.title);

      this.generatedTasks = plan.milestones.map((milestone, index) => {
        // 将日期从 YYYY/MM/DD 转换为 YYYY-MM-DD
        const dateStr = milestone.date.replace(/\//g, '-');

        return {
          // 任务ID（使用规划ID + 里程碑索引）
          id: `plan_${plan.id}_milestone_${index}`,

          // 基本信息
          title: milestone.title,
          description: milestone.description || '',

          // 日期和时间
          date: dateStr,
          isAllDay: true,
          startTime: null,
          endTime: null,

          // 四象限属性（默认：重要不紧急 - 第二象限 - 蓝色）
          isUrgent: false,
          isImportant: true,

          // 状态
          status: milestone.isCompleted ? 'completed' : 'pending',

          // 来源标记
          fromPlan: true,
          planId: plan.id,
          milestoneIndex: index,

          // 其他字段（兼容任务结构）
          categoryId: null,
          reminder: null,
          repeatType: null,
          notes: `来自规划：${plan.title}\n${milestone.days}`,

          // 时间戳
          createTime: plan.createTime,
          updateTime: new Date().toISOString()
        };
      });

      console.log('[PlanStore] 生成任务数量:', this.generatedTasks.length);
    },

    /**
     * 更新规划任务的完成状态
     * 当用户在日历中完成规划生成的任务时调用
     */
    completePlanTask(taskId) {
      const task = this.generatedTasks.find(t => t.id === taskId);
      if (!task) return;

      // 更新任务状态
      task.status = 'completed';

      // 更新规划中的里程碑状态
      this.updateMilestoneCompletion(task.planId, task.milestoneIndex, true);
    },

    /**
     * 计算总天数
     */
    calculateTotalDays(startDate, endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    },

    /**
     * 计算已进行天数
     */
    calculateProgressDays(createTime) {
      const create = new Date(createTime);
      const today = new Date();

      create.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = today - create;
      return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    },

    /**
     * 更新规划进度天数（每天调用）
     */
    updateProgressDays() {
      this.plans.forEach(plan => {
        if (!plan.isDeleted) {
          plan.stats.progressDays = this.calculateProgressDays(plan.createTime);
        }
      });
      this.savePlans();
    },

    /**
     * 保存规划到本地存储
     */
    savePlans() {
      try {
        uni.setStorageSync('user_plans', JSON.stringify(this.plans));
        uni.setStorageSync('selected_plan_id', this.selectedPlanId);
      } catch (e) {
        console.error('[PlanStore] 保存规划失败:', e);
      }
    },

    /**
     * 从本地存储加载规划
     */
    loadPlans() {
      try {
        const savedPlans = uni.getStorageSync('user_plans');
        if (savedPlans) {
          this.plans = JSON.parse(savedPlans);
        }

        const savedSelectedPlanId = uni.getStorageSync('selected_plan_id');
        if (savedSelectedPlanId) {
          this.selectedPlanId = savedSelectedPlanId;
        }

        // 更新进度天数
        this.updateProgressDays();
      } catch (e) {
        console.error('[PlanStore] 加载规划失败:', e);
      }
    },

    /**
     * 清空所有规划（测试用）
     */
    clearAllPlans() {
      this.plans = [];
      this.selectedPlanId = null;
      this.savePlans();
    }
  }
});
