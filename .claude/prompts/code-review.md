# 代码审查提示词

## 使用方式

将此提示词发送给Claude，并附上要审查的代码：

---

## 提示词内容

请对以下代码进行企业级代码审查，重点检查：

**1. 代码规范**
- 命名是否遵循约定（JS用camelCase，常量用UPPER_SNAKE_CASE）
- 是否使用了var（应该用const/let）
- 函数是否有JSDoc注释
- 代码格式是否符合Prettier规范

**2. Sequelize约定**
- 是否用camelCase调用Sequelize（不能用snake_case）
- 模型是否配置了paranoid: true（软删除）
- 字段映射是否正确

**3. 错误处理**
- 是否使用了统一的错误类（ValidationError/NotFoundError等）
- 是否有完整的try/catch
- 错误信息是否对用户友好

**4. 安全性**
- 是否有SQL注入风险（应使用参数化查询）
- 敏感信息是否暴露
- 密码字段是否叫passwordHash

**5. 性能**
- 是否有N+1查询问题
- 是否有不必要的全表扫描
- 异步操作是否合理

**6. 测试覆盖**
- 是否有对应的单元测试
- 测试覆盖率是否达到85%+

请按照代码审查日志模板（.claude/templates/code-review-template.md）格式输出审查结果。
