# 新Claude快速启动指南 (5分钟版)

> 如果你时间紧迫，只读这一份文档！

---

## 第一步: 了解你在做什么

**项目**: Planning App - 基于《易经》的人生规划系统
**你的角色**: AI全程代码编写者
**他的角色**: 唐伯虎，项目方向把控，最终决策者

---

## 第二步: 查看当前状态

```bash
cat .claude/CURRENT_STATUS.md
```

重点看: **"下一个Claude应该做什么"** 部分

---

## 第三步: 检查Git

```bash
cd D:\MyProject\Planning-app
git status
git log --oneline -5
git branch
```

---

## 第四步: 记住这几个关键点

1. **字段命名**: 数据库用`snake_case`，JS用`camelCase`，Sequelize自动映射，你只需写camelCase
2. **语言**: JavaScript (不是TypeScript)
3. **数据库**: MySQL，密码见`.claude/CURRENT_STATUS.md`的"数据库连接信息"
4. **分支**: 在`develop`分支开发，不要动`master`
5. **每次会话结束**: 必须更新`CURRENT_STATUS.md`和写工作日志

---

## 第五步: 开始工作

从`CURRENT_STATUS.md`中找到下一个任务，开始干！

---

## 遇到问题?

- 架构问题 → `docs/02-架构设计/`
- 代码规范 → `docs/04-开发规范/代码规范.md`
- 功能设计 → `docs/03-功能设计/`
- 完全迷失 → 读 `.claude/CLAUDE.md`
- 还是不懂 → 问唐伯虎
