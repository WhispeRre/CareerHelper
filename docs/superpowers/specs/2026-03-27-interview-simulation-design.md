# JD 岗位面试模拟 — 设计文档

> 日期：2026-03-27
> 状态：已批准

## 1. 概述

为 careerhelper 新增"JD 岗位面试模拟"功能。用户输入 JD（必填），可选关联简历，勾选多个面试官类型并排定顺序，AI 按顺序逐轮扮演不同面试官进行模拟面试。面试结束后生成详细报告，包含逐题点评、能力雷达图、改进建议和历史对比。

### 核心需求

- JD 必填，简历可选关联
- 文字对话（MVP），预留语音扩展能力
- 多面试官顺序串联：用户勾选后按序逐轮进行
- 6 种预设面试官 + 自定义面试官
- 完整角色卡片展示（头像、名称、职位、简介、风格）
- AI 自适应追问（上限 10 题/轮）
- 用户控制：跳过、暂停、请求提示、标记"需要复习"、提前结束本轮
- 详细报告 + 能力雷达图 + 逐题点评 + 历史对比趋势
- 完整保存对话记录 + 导出 PDF/Markdown

### 架构方案

**独立模块 + 共享 AI 基础层**：新建独立的面试模块（路由、API、数据表、Store），复用 AI provider 层（`src/lib/ai/provider.ts`）和 shadcn/ui 组件库，不影响现有简历编辑器功能。

## 2. 数据模型

### 2.1 interview_sessions（面试会话）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| userId | UUID (FK→users) | 用户 |
| resumeId | UUID (FK→resumes, nullable) | 关联简历（可选） |
| jobDescription | text | JD 原文 |
| jobTitle | string | 岗位名称（从 JD 提取） |
| selectedInterviewers | JSON | 用户选择的面试官类型列表及顺序 |
| currentRound | int | 当前进行到第几轮（从 0 开始） |
| status | enum | `preparing` \| `in_progress` \| `paused` \| `completed` |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

### 2.2 interview_rounds（面试轮次）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| sessionId | UUID (FK→interview_sessions, cascade) | 所属会话 |
| interviewerType | string | 面试官类型标识 |
| interviewerConfig | JSON | 面试官角色配置（InterviewerConfig） |
| sortOrder | int | 在会话中的顺序 |
| status | enum | `pending` \| `in_progress` \| `completed` \| `skipped` |
| questionCount | int | 实际提问数 |
| maxQuestions | int (default 10) | 追问上限 |
| summary | JSON (nullable) | 本轮小结 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

### 2.3 interview_messages（面试消息）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| roundId | UUID (FK→interview_rounds, cascade) | 所属轮次 |
| role | enum | `interviewer` \| `candidate` \| `system` |
| content | text | 消息内容 |
| metadata | JSON (nullable) | 扩展字段（标记、提示请求等） |
| createdAt | timestamp | 创建时间 |

### 2.4 interview_reports（面试报告）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (PK) | 主键 |
| sessionId | UUID (FK→interview_sessions, cascade, unique) | 1:1 关联会话 |
| overallScore | int | 综合评分 (0-100) |
| dimensionScores | JSON | 能力雷达图数据 |
| roundEvaluations | JSON | 每轮逐题点评 |
| overallFeedback | text | 总体建议 |
| improvementPlan | JSON | 改进建议 + 推荐学习资源 |
| createdAt | timestamp | 创建时间 |

## 3. 面试官角色系统

### 3.1 预设面试官（6 种）

| 类型标识 | 名称 | 职位 | 风格 | 考察维度 |
|---------|------|------|------|---------|
| `hr` | 李雯 | HR总监 | 开放式提问，关注动机和匹配度 | 求职动机、文化匹配、薪资期望、稳定性 |
| `technical` | 张明 | 技术专家 | 由浅入深追问，考察深度 | 技术原理、系统设计、代码能力、问题排查 |
| `scenario` | 王强 | 架构师 | 给定场景，追问方案细节 | 系统设计、方案权衡、技术选型、容量规划 |
| `behavioral` | 刘芳 | HRBP | STAR 法则引导 | 团队协作、冲突处理、抗压能力、领导力 |
| `project_deep_dive` | 陈刚 | 技术Leader | 针对简历项目逐层追问 | 项目贡献度、技术决策、难点攻克、复盘反思 |
| `leader` | 赵总 | 技术VP | 高层次提问，关注格局 | 职业规划、技术视野、团队管理、业务理解 |

### 3.2 InterviewerConfig 数据结构

```typescript
interface InterviewerConfig {
  type: string                  // 类型标识
  name: string                  // 面试官名称
  title: string                 // 职位头衔
  avatar: string                // 头像标识（匹配预设头像组件）
  bio: string                   // 简介
  style: string                 // 提问风格描述
  focusAreas: string[]          // 重点考察方向
  systemPrompt: string          // AI system prompt 模板
  personality: string           // 性格特征（影响语气语调）
}
```

### 3.3 自定义面试官

用户可创建自定义类型，填写名称、职位、风格描述、考察维度（必填），系统据此生成 system prompt。

### 3.4 视觉区分

- 面试开始前展示**角色卡片**（头像、名称、职位、简介、风格标签）
- 对话中通过**头像 + 名称标签 + 气泡颜色**区分
- 面试官切换时有**过渡动画**（卡片翻转或淡入淡出）

## 4. 面试流程

### 4.1 完整流程

```
准备阶段 → 逐轮面试 → 生成报告 → 查看/导出
```

### 4.2 准备阶段

1. 进入面试模拟页面（`/[locale]/interview`）
2. 输入/粘贴 JD（必填，上限 5000 字）
3. 可选关联简历（从已有列表选择）
4. 勾选面试官组合，拖拽调整顺序
5. 点击"开始面试"

### 4.3 单轮面试流程

1. 展示当前面试官角色卡片（2-3 秒展示后进入对话）
2. 面试官开场白（自我介绍 + 说明本轮重点）
3. 问答循环：
   - 面试官提问 → 用户回答 → AI 判断追问/换题
   - AI 自适应控制：回答到位换题，不充分追问，上限 10 题
4. 面试官本轮总结（简短点评）
5. 自动切换下一轮

### 4.4 用户控制

| 操作 | 行为 | 报告标注 |
|------|------|---------|
| 跳过问题 | AI 记录并提下一题 | 标注"已跳过" |
| 暂停面试 | 保存状态，可从 dashboard 恢复 | — |
| 提前结束本轮 | 跳到下一个面试官 | — |
| 请求提示 | 面试官给思路引导（非答案） | 标注"使用了提示" |
| 标记"需要复习" | 消息标记 | 报告中高亮 |

### 4.5 面试界面布局

- **顶部**：进度条（面试官头像序列，当前高亮）+ 问题进度（如 3/10）
- **中间**：对话区域（面试官消息左侧带头像，用户消息右侧）
- **底部**：输入框 + 操作按钮栏（跳过、请求提示、标记、结束本轮、暂停）

## 5. 评分报告系统

### 5.1 报告总览

- 综合评分（0-100），评分等级（优秀 90+ / 良好 75-89 / 合格 60-74 / 需提升 <60）
- 一句话总评
- 面试基本信息（岗位、日期、轮次数、总问题数）

### 5.2 能力雷达图

6-8 个维度，根据面试官类型动态确定：

- 通用：沟通表达、逻辑思维、抗压能力
- HR 面：求职动机、文化匹配
- 技术面：技术深度、代码能力
- 场景面：系统设计、方案权衡
- 行为面：团队协作、领导力
- 项目深挖：项目理解、技术决策
- Leader 面：技术视野、业务理解

使用 recharts 绘制。

### 5.3 逐轮评估

- 每个面试官一个折叠面板
- 本轮评分 + 面试官点评
- 逐题分析：问题原文、回答摘要、评分（1-5 星）、亮点、不足、参考答案思路
- "需要复习"标记高亮，"使用了提示"标注

### 5.4 改进建议

- 按优先级排列（高/中/低）
- 每条：问题描述、具体建议、推荐学习资源（文章、书籍、课程方向）

### 5.5 历史对比（2 次以上记录时）

- 折线图：综合评分趋势
- 雷达图叠加：本次 vs 上次 / vs 历史最佳
- 维度变化标注（↑ 提升 / ↓ 下降 / → 持平）

### 5.6 导出

- PDF：完整报告含图表
- Markdown：结构化文本

## 6. 路由与页面结构

### 6.1 新增路由

```
/[locale]/interview                  — 面试大厅（历史列表 + 新建入口）
/[locale]/interview/new              — 新建面试（JD、简历、面试官选择）
/[locale]/interview/[id]             — 面试进行中（对话界面）
/[locale]/interview/[id]/report      — 面试报告
```

### 6.2 导航集成

- navbar 新增"面试模拟"导航项
- dashboard 增加面试模拟快捷入口卡片

### 6.3 与现有系统关系

- 共享 `[locale]/layout.tsx`（i18n、auth、theme provider）
- 共享 navbar / footer 组件
- AI 设置复用 `settings-store`

## 7. API 路由

### 7.1 面试会话 CRUD

```
POST   /api/interview                    — 创建面试会话
GET    /api/interview                    — 获取用户面试列表
GET    /api/interview/[id]               — 获取会话详情
PUT    /api/interview/[id]               — 更新状态（暂停/恢复）
DELETE /api/interview/[id]               — 删除面试记录
```

### 7.2 面试交互

```
POST   /api/interview/[id]/chat          — 面试对话（流式）
POST   /api/interview/[id]/control       — 控制指令（跳过、请求提示、结束本轮）
POST   /api/interview/[id]/mark          — 标记消息（需要复习）
```

### 7.3 报告

```
POST   /api/interview/[id]/report        — 生成面试报告
GET    /api/interview/[id]/report        — 获取报告
GET    /api/interview/[id]/report/export  — 导出（PDF/Markdown）
```

### 7.4 历史统计

```
GET    /api/interview/history/stats       — 历史统计（趋势对比数据）
```

### 7.5 AI 交互核心逻辑

**System prompt 构建：**

```typescript
function buildInterviewPrompt(round: InterviewRound, session: InterviewSession) {
  return `
    你是 ${round.interviewerConfig.name}，${round.interviewerConfig.title}。
    ${round.interviewerConfig.bio}

    提问风格：${round.interviewerConfig.style}
    性格特征：${round.interviewerConfig.personality}
    考察维度：${round.interviewerConfig.focusAreas.join('、')}

    岗位 JD：${session.jobDescription}
    ${session.resumeId ? `候选人简历：${resumeContent}` : ''}

    规则：
    1. 每次只问一个问题
    2. 根据回答质量决定是否追问（不充分则追问，到位则换题）
    3. 本轮最多提 ${round.maxQuestions} 个问题
    4. 当你认为本轮考察充分或达到上限时，输出 [ROUND_COMPLETE] 标记
    5. 保持角色一致性，语气符合 personality 设定
  `
}
```

**流式响应：** 使用 `streamText()` + `toUIMessageStreamResponse()`，复用 `src/lib/ai/provider.ts`。

**控制指令：** 通过注入 system message 实现（跳过→提下一题，提示→给思路，结束→输出小结）。

**报告生成：** 使用 `generateObject()` + Zod schema，收集所有轮次对话一次性生成结构化报告。

## 8. 前端状态管理

### 8.1 interview-store（Zustand）

```typescript
interface InterviewStore {
  // 会话状态
  currentSession: InterviewSession | null
  currentRound: InterviewRound | null
  rounds: InterviewRound[]

  // 面试进行状态
  status: 'preparing' | 'in_progress' | 'paused' | 'completed'
  questionIndex: number

  // 消息标记
  markedMessages: Set<string>   // "需要复习"
  hintedQuestions: Set<string>  // 使用了提示
  skippedQuestions: Set<string> // 已跳过

  // Actions
  createSession(data: CreateInterviewInput): Promise<string>
  loadSession(id: string): Promise<void>
  startInterview(): void
  pauseInterview(): Promise<void>
  resumeInterview(): Promise<void>
  advanceToNextRound(): void
  skipCurrentRound(): void
  markMessage(messageId: string): void
  unmarkMessage(messageId: string): void
  requestHint(): Promise<void>
  skipQuestion(): Promise<void>

  // 报告
  report: InterviewReport | null
  generateReport(): Promise<void>
}
```

### 8.2 组件树

```
interview/
├── InterviewLobby              — 面试大厅
│   ├── InterviewCard           — 面试记录卡片
│   └── InterviewFilters        — 筛选/排序
├── InterviewSetup              — 新建面试
│   ├── JDInput                 — JD 输入区域
│   ├── ResumeSelector          — 关联简历选择器
│   └── InterviewerPicker       — 面试官勾选 + 拖拽排序
│       ├── InterviewerCard     — 角色卡片
│       └── CustomInterviewerDialog — 自定义面试官表单
├── InterviewRoom               — 面试进行中
│   ├── ProgressBar             — 顶部进度条
│   ├── InterviewerBanner       — 当前面试官信息
│   ├── MessageList             — 对话消息列表
│   │   ├── InterviewerMessage  — 面试官消息（左，带头像）
│   │   └── CandidateMessage    — 用户消息（右）
│   ├── MessageInput            — 输入框
│   └── ControlBar              — 操作按钮栏
├── RoundTransition             — 轮次切换过渡动画
└── InterviewReport             — 面试报告
    ├── ReportOverview          — 总览（评分、等级、总评）
    ├── RadarChart              — 能力雷达图
    ├── RoundEvaluation         — 逐轮评估（折叠面板）
    │   └── QuestionReview      — 逐题分析
    ├── ImprovementPlan         — 改进建议
    ├── HistoryComparison       — 历史对比
    └── ExportButtons           — 导出按钮
```

### 8.3 useChat 集成

- 复用 `@ai-sdk/react` 的 `useChat` hook
- 独立 transport 指向 `/api/interview/[id]/chat`
- `body` 函数动态传递 `roundId`、控制指令
- 监听 `[ROUND_COMPLETE]` 标记触发轮次切换

## 9. i18n

- `messages/zh.json` 和 `messages/en.json` 新增 `interview` 命名空间
- 覆盖：页面标题、按钮、状态标签、面试官预设信息、报告模板文案
- 面试对话语言跟随 locale（system prompt 中指定）
- 预设面试官名称/简介按 locale 提供中英文版本

## 10. 边界情况

| 场景 | 处理方案 |
|------|---------|
| AI 断流/超时 | 保存已有对话，允许刷新恢复（paused 状态） |
| 浏览器关闭 | 自动暂停，下次从 dashboard 恢复 |
| JD 过长 | 前端限制 5000 字，prompt 中做摘要截断 |
| 简历未关联 | 仅基于 JD 提问，提示关联简历可获更好体验 |
| 自定义面试官校验 | 名称、考察维度必填，风格描述可选（有默认模板） |
| 报告生成失败 | 重试机制，保留对话允许重新生成 |

## 11. 不在 MVP 范围

- 语音输入/输出
- AI 面试官头像动画
- 多人协作面试（群面模拟）
- 面试题库管理
