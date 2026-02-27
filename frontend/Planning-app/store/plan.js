import { defineStore } from 'pinia';
import { useTaskStore } from './task.js';
import { deleteTask, updateTask } from '@/api/task.js';

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
        icon: planData.icon || '', // 图标ID
        iconEmoji: planData.iconEmoji || '🔔', // 图标emoji，默认铃铛
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
     * @param {string} planId - 规划ID
     * @param {object} updates - 要更新的数据
     * @returns {boolean} 是否更新成功
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
        return true;
      }
      return false;
    },

    /**
     * 删除规划
     * @param {string} planId - 规划ID
     * @param {boolean} deleteWithTasks - 是否同时删除关联的计划
     */
    async deletePlan(planId, deleteWithTasks = false) {
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

        // 处理关联的任务
        const taskStore = useTaskStore();

        // 1. 从 localStorage 中获取任务
        let localTasks = [];
        try {
          const savedTasks = uni.getStorageSync('tasks');
          if (savedTasks) {
            localTasks = JSON.parse(savedTasks);
          }
        } catch (e) {
          console.error('[PlanStore] 读取 localStorage 任务失败:', e);
        }

        // 2. 从 taskStore 中获取任务（包含 localStorage 和 API 任务）
        const allTasks = taskStore.tasks;

        // 3. 筛选出属于该规划的任务（支持 categoryId 和 planId）
        const planTasks = allTasks.filter(t =>
          t.categoryId === planId || t.planId === planId
        );

        if (deleteWithTasks) {
          // 删除该规划下的所有任务
          console.log('[PlanStore] 删除规划下的所有任务，数量:', planTasks.length);

          for (const task of planTasks) {
            try {
              const taskId = String(task.id);
              const isLocalTask = taskId.startsWith('task_');

              if (isLocalTask) {
                // localStorage 任务：从 localStorage 中删除
                localTasks = localTasks.filter(t => String(t.id) !== taskId);
              } else {
                // 后端任务：调用 API 删除
                await deleteTask(taskId);
              }

              // 从 taskStore 中移除
              taskStore.tasks = taskStore.tasks.filter(t => String(t.id) !== taskId);
            } catch (e) {
              console.error('[PlanStore] 删除任务失败:', task.id, e);
            }
          }

          // 保存更新后的 localStorage
          try {
            uni.setStorageSync('tasks', JSON.stringify(localTasks));
          } catch (e) {
            console.error('[PlanStore] 保存 localStorage 失败:', e);
          }
        } else {
          // 将该规划下的任务改为无分类（移除 planId/categoryId）
          console.log('[PlanStore] 将规划下的任务改为无分类，数量:', planTasks.length);

          for (const task of planTasks) {
            try {
              const taskId = String(task.id);
              const isLocalTask = taskId.startsWith('task_');

              if (isLocalTask) {
                // localStorage 任务：更新 categoryId/planId 为 null
                const taskIndex = localTasks.findIndex(t => String(t.id) === taskId);
                if (taskIndex !== -1) {
                  localTasks[taskIndex].categoryId = null;
                  localTasks[taskIndex].planId = null;
                }
              } else {
                // 后端任务：调用 API 更新
                await updateTask(taskId, {
                  categoryId: null,
                  planId: null
                });
              }

              // 更新 taskStore 中的任务
              const storeTaskIndex = taskStore.tasks.findIndex(t => String(t.id) === taskId);
              if (storeTaskIndex !== -1) {
                taskStore.tasks[storeTaskIndex].categoryId = null;
                taskStore.tasks[storeTaskIndex].planId = null;
              }
            } catch (e) {
              console.error('[PlanStore] 更新任务失败:', task.id, e);
            }
          }

          // 保存更新后的 localStorage
          try {
            uni.setStorageSync('tasks', JSON.stringify(localTasks));
          } catch (e) {
            console.error('[PlanStore] 保存 localStorage 失败:', e);
          }
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

          // 恢复规划的选中状态
          this.plans.forEach(p => {
            p.isSelected = (p.id === savedSelectedPlanId);
          });
        } else {
          // 如果没有选中的规划，清除所有选中状态
          this.plans.forEach(p => {
            p.isSelected = false;
          });
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
