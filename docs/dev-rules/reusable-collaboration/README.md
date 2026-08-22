# 可复用协作经验：Agent 与人类协作者

> 本文是跨项目组织经验，不是 Cindy 仓库的新增强制规则。它从本仓现行的
> AGENTS.md、开发流程、PR 模板、设计规范、CI 与 Git hook 中提炼，用于在其他
> 项目里搭建可维护的人机协作体系。

## 核心模型

可复用的协作闭环是：

1. **按风险路由规则**：入口文档不堆砌所有约束，而是列出“什么改动必须先读哪份规则”。
2. **把硬约束交给机器**：签名、测试、类型、i18n、协议兼容、设计依据等能自动判断的内容，
   用脚本、hook 和 CI 固定下来。
3. **把判断交给 review**：安全边界、数据迁移、协议半径、产品语义、UI 质量等机器难以
   判断的内容，由人工和 AI reviewer 分层检查。
4. **用 PR 收集证据**：改动范围、验证命令、未验证原因、风险、回滚方式和设计依据都进入
   结构化描述，而不是留在聊天记录里。

## Agent 指引体系

- 为每个仓库准备一个共用入口，例如 AGENTS.md，让 Codex、Claude Code 和其他 agent 读同一份正本；其他文件只做引用，避免双份规则漂移。
- 入口文档保留四类内容：仓库边界、规则索引、通用工作流程、安全底线。
- 模块专属规则放到模块内嵌套 AGENTS.md；跨模块专题规则放到集中文档，并在入口索引。
- 每条规则写清触发条件、必须做什么、禁止做什么、验证方法和例外条件。
- 首次接触仓库先读仓库地图；准备提交、创建 worktree、review 或触碰高风险模块前，再按入口索引读取专项规则。

## 分支、提交与 PR

- 默认 PR-first。功能、修复和文档都从最新默认分支创建短生命周期分支，一个 PR 只解决一个清晰问题。
- 直推默认分支只允许维护者明确选择，并追加独立对抗性 review。
- 本地提交前至少运行能影响本次改动的相关单测、受影响 package 的 typecheck，以及签名、文档、i18n、端点、migration 等项目已有的快速守卫。
- 每个 commit 都带可追溯授权声明，例如 DCO Signed-off-by；agent 自动提交也必须遵守。
- PR 标题使用 type(scope): description；正文至少覆盖这次改了什么、明确包含与不包含的范围、用户可见变化、实际执行的验证和未执行验证的原因、风险分类与影响范围、回滚或降级方式，以及 UI 改动引用的设计规范章节。
- Worktree 会话要约定：checkout 完成后再装依赖、编辑不一定影响运行中实例、结束前必须 commit、活跃会话目录不能被外部 cleanup 误删。

## Review 分层

用统一严重度，避免“风格意见”阻塞合入：

| 级别 | 含义 | 处理 |
| --- | --- | --- |
| P0 | 红线、崩溃、数据丢失、安全、跨平台失效 | 不改不能合 |
| P1 | 明显 bug、规范违反、影响面未处理 | 本次必修 |
| P2 | 可选优化或风格偏好 | 不上报或单独跟踪 |

自动 review 只处理机器查不到的风险，例如：

- 凭证、令牌和用户数据落盘位置；
- 进程、权限、IPC、CSP 或沙箱边界；
- migration 的可回滚性和历史兼容；
- 协议、插件、移动端冷更等存量兼容；
- system prompt、tool/MCP 暴露和模型行为漂移；
- Light/Dark 双主题、可访问性、交互一致性和跨端体验；
- 测试是否被 skip、删除或弱化。

AI review 的输出应映射到统一严重度，并明确说明它不替代 CI 和人工 review。

## UI / UX 规范

- 设计规则集中放在权威正本；根目录或入口文件只做跳转。
- 新增或修改 UI 必须同时覆盖 Light 和 Dark，所有颜色走语义 token；只实现一种模式视为未完成。
- 视觉系统应固定字体、层级、圆角、间距、边框、阴影、动效时长和曲线，避免组件各自发明。
- 交互规范覆盖内容可选性、焦点管理、键盘与 IME、加载时序、动画性能、tooltip 和危险操作确认。
- 文案进入 i18n，术语表是唯一裁决来源；机器门禁检查 key、语言、品牌词和术语一致性，人工 review 检查语境和准确性。

## 自动化与 Hook

优先把组织经验变成可执行守卫：

| 经验 | 自动化形态 |
| --- | --- |
| 提交人有授权声明 | prepare-commit-msg hook + DCO check |
| 测试必须真实通过 | related test、分片单测、双平台 CI |
| UI 改动必须引用设计依据 | PR 变更路径检测 + PR 正文字段校验 |
| 文案不漂移 | i18n key、术语表、品牌词守卫 |
| 高风险模块不静默变更 | CODEOWNERS、专项 CI guard、白名单确认 |
| AI review 不越权 | 最小权限、fork/draft 过滤、复用 workflow 钉 commit SHA |

CI 建议分成四层：

1. 快速失败：文档契约、i18n、端点、依赖锁定、轻量 guard。
2. 类型与迁移：各端 typecheck、schema/migration 校验。
3. 完整单测：按平台或 workspace 分片，保证并集等于全量。
4. 专项集成：Git、数据库、协议、模拟器或真实运行时 smoke。

## 迁移到新项目的落地清单

1. 建立共用 agent 入口，列出仓库边界和规则索引。
2. 建立仓库地图，说明每个顶层目录的职责和主要使用方。
3. 写清分支、worktree、commit、PR、review 和直推规则。
4. 设计 PR 模板，强制记录验证、风险、回滚、UI 依据和未验证原因。
5. 定义 P0/P1/P2 review 口径，并让 AI review 使用同一映射。
6. 把签名、测试、类型、i18n、migration 和设计依据做成脚本、hook 或 CI check。
7. 为 UI、安全、协议、数据库、Agent 行为和插件兼容建立专项规则。
8. 定期把重复纠正沉淀为规则或自动化守卫，而不是只留在个人经验里。

## 本仓参考实现

- 共用 agent 入口：AGENTS.md
- worktree、PR、直推和 review 口径：docs/dev-rules/development-workflow.md
- PR 模板：.github/PULL_REQUEST_TEMPLATE.md
- 自动 review 审阅口径：REVIEW.md
- 设计系统：docs/design-rules/DESIGN.md
- 工程守卫：docs/dev-rules/engineering-conventions.md
- Agent 行为约束：docs/dev-rules/maker-core-and-agent-behavior.md
- 客户端 CI：.github/workflows/ci.yml
- DCO hook：.githooks/prepare-commit-msg
