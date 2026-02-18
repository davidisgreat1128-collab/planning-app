# 架构设计提示词

## 使用方式

在需要设计新功能架构时使用：

---

## 提示词内容

请为以下功能设计企业级架构方案，需要考虑：

**项目约束**:
- 后端: Node.js + Express + Sequelize ORM + MySQL
- 前端: UniApp (Vue 3) + Pinia
- 语言: JavaScript (不用TypeScript)
- 字段映射: 数据库snake_case，JS代码camelCase

**设计要求**:

1. **数据库设计**
   - 表名(snake_case复数)、字段名(snake_case)
   - 必须包含: id, created_at, updated_at, deleted_at(软删除)
   - 合理的索引设计

2. **Sequelize模型**
   - camelCase字段名 + field映射
   - 配置underscored:true, paranoid:true
   - 完整的关联关系

3. **API接口设计**
   - RESTful规范
   - 统一响应格式: {success, code, message, data}
   - 合理的HTTP状态码

4. **分层设计**
   - Controller: 只处理HTTP请求/响应
   - Service: 核心业务逻辑
   - Model: 数据库操作

5. **错误处理**
   - 使用统一错误类
   - 完整的错误边界

请同时评估方案的优缺点，并在必要时记录为ADR。
