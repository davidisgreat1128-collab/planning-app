/**
 * 规划记录状态管理 (Pinia)
 */

import { defineStore } from 'pinia';
import { getPlanningList, createPlanning, updatePlanning, deletePlanning, updatePlanningStatus } from '@/api/planning.js';

export const usePlanningStore = defineStore('planning', {
  state: () => ({
    /** 当前列表数据 */
    list: [],
    /** 分页信息 */
    pagination: {
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0
    },
    /** 当前筛选的规划类型 */
    currentType: '',
    /** 加载状态 */
    loading: false
  }),

  getters: {
    /** 是否还有更多数据 */
    hasMore: (state) => state.pagination.page < state.pagination.totalPages
  },

  actions: {
    /**
     * 加载规划列表（刷新）
     * @param {string} [type] - 规划类型
     */
    async loadList(type = '') {
      this.loading = true;
      this.currentType = type;
      try {
        const result = await getPlanningList({ type, page: 1, pageSize: this.pagination.pageSize });
        this.list = result.list;
        this.pagination = result.pagination;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 加载更多（分页追加）
     */
    async loadMore() {
      if (!this.hasMore || this.loading) return;
      this.loading = true;
      try {
        const nextPage = this.pagination.page + 1;
        const result = await getPlanningList({
          type: this.currentType,
          page: nextPage,
          pageSize: this.pagination.pageSize
        });
        this.list.push(...result.list);
        this.pagination = result.pagination;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 创建规划
     * @param {object} data
     */
    async create(data) {
      const newItem = await createPlanning(data);
      this.list.unshift(newItem);
      this.pagination.total += 1;
      return newItem;
    },

    /**
     * 更新规划
     * @param {number} id
     * @param {object} data
     */
    async update(id, data) {
      const updated = await updatePlanning(id, data);
      const index = this.list.findIndex(item => item.id === id);
      if (index !== -1) this.list[index] = updated;
      return updated;
    },

    /**
     * 更新规划状态
     * @param {number} id
     * @param {string} status
     */
    async updateStatus(id, status) {
      const updated = await updatePlanningStatus(id, status);
      const index = this.list.findIndex(item => item.id === id);
      if (index !== -1) this.list[index] = updated;
      return updated;
    },

    /**
     * 删除规划
     * @param {number} id
     */
    async remove(id) {
      await deletePlanning(id);
      this.list = this.list.filter(item => item.id !== id);
      this.pagination.total -= 1;
    }
  }
});
