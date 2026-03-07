# Changelog

所有版本变更记录遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范。

版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Planned
- 任务详情页面优化
- 重复任务批量操作功能
- 数据导出功能

---

## [0.2.0-stable] - 2026-03-07

### Added (新增功能)
- **日历工作日角标功能**
  - 新增 `work_days` 数据表，存储国务院法定节假日和调休数据
  - 实现工作日角标显示：休息日显示红色"休"，调休补班显示黄色"班"
  - 导入2026年完整工作日数据（33天假期 + 6天调休）
  - 新增后端API：`GET /api/v1/holidays/workdays/year/:year` 和 `/workdays/range`

- **节日数据系统**
  - 导入57条节日数据（中国节日、西方节日、国际节日、节气）
  - 实现节日优先级算法：中国节日 > 农历节日 > 西方节日 > 节气 > 国际节日 > 农历日期
  - 支持固定日期节日（如元旦1/1）和农历节日（如春节正月初一）
  - 集成 `lunar-javascript` 库进行农历转换和节气计算

- **三层架构完善**
  - 实现 CategoryRepository 企业级数据管理
  - 添加离线操作队列和指数退避重试机制
  - 实现 memoryCache + localStorage + 服务器同步的三级缓存
  - 支持乐观锁版本控制（version 字段）

### Changed (功能变更)
- **日历条UI优化**
  - 调整日期数字和节日标签位置（日期在上，节日在下）
  - 节日标签支持自动换行显示超长文本（宽度90rpx，居中对齐）
  - 优化任务点显示，最多显示2个象限颜色
  - 工作日角标固定在右上角（position: absolute, z-index: 10）

- **代码性能优化**
  - 注释非关键调试日志，减少控制台输出50%+
  - 优化 holidayService 查询逻辑
  - 改进 useCalendar composable 的响应式性能

### Fixed (Bug修复)
- 修复日历条拖拽手势在H5环境下失效问题（e.button为undefined）
- 修复删除任务和重复任务象限切换的方法调用错误
- 修复重复任务象限切换对话框的3个问题
- 修复象限检测CSS选择器错误
- 修复 holiday.js 路由文件语法错误（sed命令插入的额外字符）
- 修复 useCalendar.js 删除日志后的语法错误（孤立的对象字面量）

### Technical (技术改进)
- 完善 Sequelize ORM 配置，统一 camelCase ↔ snake_case 字段映射
- 实现单例模式：数据库连接、日志记录器全局唯一
- 强化 API 四层架构：Route → Controller → Service → Model
- 添加详细的中文代码注释和 JSDoc 文档
- 完善 Git commit 规范和工作流

### Documentation (文档)
- 更新 `.claude/CLAUDE.md` - Claude AI 协作完全指南 v1.3
- 新增《三层架构设计.md》详细技术文档
- 新增《详细字段映射表.md》数据库字段规范
- 新增《超标文件追踪清单.md》代码质量管理
- 完善《系统架构完整结构图.md》

### Database (数据库)
- 新增 `work_days` 表（date, type, year, holiday_name, remark）
- 导入 `20260306152306-work-days-2026.js` seeder
- `holidays` 表包含57条记录（元旦、春节、清明、劳动节、端午、中秋、国庆等）

---

## [0.1.0-alpha] - 2026-02-17

### Added
- 项目初始化：完整目录结构搭建
- 后端骨架：Express + Sequelize + MySQL 配置
- 前端骨架：UniApp Vue3 + Pinia 状态管理
- Claude AI协作文档系统（`.claude/` 目录）
- 数据库设计文档（ERD + 表设计）
- Git Flow工作流配置

---

## 版本历史

| 版本 | 日期 | 说明 | Commit |
|------|------|------|--------|
| 0.2.0-stable | 2026-03-07 | 日历功能稳定版本 | adda017 |
| 0.1.0-alpha | 2026-02-17 | 项目初始化 | - |
