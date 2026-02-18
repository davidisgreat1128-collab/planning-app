# 实体关系图 (ERD)

```
┌─────────────────────────────┐
│           users             │
├─────────────────────────────┤
│ PK  id                      │
│     email (UNIQUE)          │
│     password_hash           │
│     nickname                │
│     avatar_url              │
│     birth_date              │
│     current_stage           │
│     stage_score             │
│     role                    │
│     is_active               │
│     last_login_at           │
│     created_at              │
│     updated_at              │
│     deleted_at              │
└────────────┬────────────────┘
             │ 1
             │
     ┌───────┴──────────────────────────────────┐
     │ N                                         │ N
     ▼                                           ▼
┌─────────────────────────┐     ┌────────────────────────────────┐
│    planning_records     │     │      divination_records        │
├─────────────────────────┤     ├────────────────────────────────┤
│ PK  id                  │     │ PK  id                         │
│ FK  user_id             │     │ FK  user_id                    │
│     type                │     │     question                   │
│     title               │     │     method                     │
│     content             │     │ FK  hexagram_id ──────────┐   │
│     status              │     │ FK  changing_hexagram_id ─┤   │
│     start_date          │     │     lines (JSON)           │   │
│     end_date            │     │     interpretation         │   │
│     target_score        │     │     created_at             │   │
│     current_score       │     │     updated_at             │   │
│     related_stage       │     │     deleted_at             │   │
│     iching_advice       │     └────────────────────────────────┘
│     created_at          │                    │ N (×2)
│     updated_at          │                    │
│     deleted_at          │                    │ 1
└─────────────────────────┘     ┌──────────────▼─────────────────┐
                                 │       iching_hexagrams         │
                                 ├────────────────────────────────┤
                                 │ PK  id (1-64)                  │
                                 │     code (UNIQUE)              │
                                 │     name                       │
                                 │     chinese_name               │
                                 │     symbol                     │
                                 │     upper_trigram              │
                                 │     lower_trigram              │
                                 │     description                │
                                 │     judgment                   │
                                 │     image                      │
                                 │     planning_advice (JSON)     │
                                 │     favorable_stages (JSON)    │
                                 │     created_at                 │
                                 │     updated_at                 │
                                 └────────────────────────────────┘
```

## 业务说明

- **users** → 用户体系，`current_stage` 记录当前易经人生阶段（6个阶段）
- **planning_records** → 核心规划数据，支持7种规划类型
- **iching_hexagrams** → 64卦静态数据，初始化时导入，业务不修改
- **divination_records** → 用户每次起卦的记录，`lines` 存储JSON格式的六爻
