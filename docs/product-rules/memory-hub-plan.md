# 记忆中心（Memory Hub）：查看、管理与变化方案

> **状态**：提案（2026-09-01 首稿；同日讨论后更新：归属已裁决为 Core，
> 新增 AI 主动分析与洞察板块。其余待产品决策，未进入实现）。
> **适用范围**：Desktop 优先；Mobile / 远程场景见 §11。
> **读取时机**：实现记忆可视化、编辑、历史、维护产品化相关功能前。

## 1. 背景与问题

现状盘点（已核对代码，2026-09-01）：

- 记忆分片是本地明文 `.md`（frontmatter 仅 `title` / `description` / `type` /
  `updatedAt`）+ `MEMORY.md` 索引；per-workdir 一个 SQLite（`fts.db`）做 FTS5
  派生索引；**文件是 source of truth**（`packages/maker-core/src/memory/storage.ts`、
  `fts.ts`、`store.ts`）。
- UI 只有「设置 → 个性化 → 记忆」的开关与重置
  （`apps/desktop/src/renderer/components/settings/MemorySection.tsx`）；IPC 只有
  get / set / reset（`apps/desktop/src/main/maker-ipc/channels.ts`），渲染进程
  没有任何读取记忆内容的通道。
- 细粒度能力只存在于 `cindy_memory` MCP 的 7 个工具（read / list / write /
  delete / consolidate / review / search，`packages/lizi-mcps/src/cindy_memoryMcpServer.ts`），
  只能由 agent 在任务里调用，用户无法直接触达。
- 没有变更历史：无创建时间、操作者、版本与 diff；`memory_review` 是一次性
  LLM 建议，结果不落库、不进 UI。
- 重置不可撤销（`apps/desktop/help-knowledge/memory.md` 明示 "aren't undoable"）。

结果：用户看不到 agent 记了什么、为什么、什么时候变的，也修不了记错的内容；
记忆成了只能整体开关或清空的黑箱。这与产品原则「用户操作的对象、影响范围、
进行状态和最终结果应清楚可见」（`core-product-principles.md` §4.1）直接冲突。

## 2. 方案概述：三层递进的记忆中心

在「设置 → 个性化 → 记忆」现有面板上增加「管理记忆…」入口，打开独立的
记忆中心视图。按渐进披露分三层，默认只展示第一层：

### L1 概览（默认）

- 顶部 workdir 切换器：记忆天然按工作目录隔离，先选「哪个项目的记忆」，
  默认落在当前活跃 workdir。
- 按 4 个 curated 类型（user / feedback / project / reference）分组的条目卡片：
  标题、一行 hook（即索引行）、更新时间、体积。信息量对齐 `MEMORY.md`——
  用户看到的就是会注入的内容来源。
- `digest` 类型单独折叠为「内部摘要」区：只读、注明「不注入对话」，与
  curated 记忆严格分区（与 `types.ts` 的 curated 语义一致）。
- 顶部常驻搜索框：复用现有 FTS（`memory_search` 同源索引），即时过滤。

### L2 条目详情

- 点开单条：渲染完整 Markdown 正文；frontmatter 的 `title` / `description`
  可编辑；正文可编辑（保存走 store 单写路径，见 §7）。
- 显示该条的元信息：创建时间、最近更新、来源（agent / 用户 / 合并，见 §3）。
- 单条历史抽屉：按时间列出该条的所有变更，支持任意两版本的 diff 视图。

### L3 透明度视图

- 「下一条任务会注入什么」：展示 `MEMORY.md` 索引快照预览——即新会话
  system prompt 将携带的记忆索引内容，明确标注「会话启动时快照、任务中途
  编辑不影响已开任务」。这是目前任何界面都没有的能力：让用户确切知道
  模型看到了什么。
- `digest` 区在此层明确标注排除原因（内部摘要、不进索引、不撑上下文）。

## 3. 记忆时间线：事件溯源

补齐「记忆的变化」能力的核心：**在 store 单写路径上追加事件日志**。

- 事件 schema（建议）：`{ ts, op: create|update|append|delete|restore|consolidate,
  actor: agent|user|maintenance, filename, type, beforeSha, afterSha,
  snapshot?（小分片可直接存前后全文）, taskRef?（写入来源任务，遵循
  task-and-conversation-naming 的「任务」用语） }`。
- 落点：与 `fts.db` 同一个 per-workdir SQLite（maker-core 自有存储，由 host
  注入 sqliteFactory），新增事件表。**不进 Desktop Drizzle 主库**——记忆存储
  本就独立于 `localDb`，不触发 migration 链（边界见
  `database-and-migrations.md` 的适用范围）。
- 不变量：文件仍是 source of truth；事件表是派生审计数据，可由
  rebuild 重建（对齐 fts.ts「派生索引失败不阻塞主流程」的失败原则）。
- 保留策略：本地滚动保留（如最近 500 条或按体积上限），**永不上传**——
  记忆内容属用户内容，事件日志同样遵守日志脱敏红线
  （`log-upload-and-redaction.md`），不进任何上报通道。
- UI 呈现：全局「最近变化」feed（谁在什么时候改了什么）+ 单条历史 diff。

## 4. AI 主动分析与推荐

> 2026-09-01 用户裁决：记忆管理必须内建 AI 的主动分析与推荐——提示用户
> 哪些记忆需要更新、哪些语义重叠可以合并、哪些可以废弃。

- **分析维度**：需要更新（与更新事实矛盾 / 内容过时）、语义重叠
  （可合并的重复条目）、可废弃（长期不再相关）、类别错放（type 放错）。
- **推荐对象模型**：每条推荐持久化为一等对象
  `{ id, kind, targets: filename[], evidence, rationale,
  status: pending|accepted|dismissed|expired, createdAt, decidedAt }`，
  落 per-workdir SQLite 新表。推荐可审计、可追溯，取代现有一次性
  `memory_review` 输出；agent 侧 MCP 工具触发 review 时产出也统一落为
  推荐对象。
- **触发策略（分期）**：P3 为手动触发（记忆中心「分析」按钮）；P4 升级为
  后台 delta 触发——自上次分析以来新增 / 修改 ≥ N 条、应用空闲时运行，
  设置提供总开关与「立即分析」。
- **成本护栏**：分析走 Haiku 级 one-shot；输入仅索引 + delta 条目（非全量
  语料）；频率设上限；沿用现有 one-shot 路由停用守卫
  （`isOneShotRouteDisabled`），路由被用户停用时自动跳过并顺延。
- **执行边界（红线）**：AI 只建议不执行。更新 / 合并 / 废弃一律逐条经
  用户确认后走 store 单写路径并记入事件日志；不允许任何静默改写或删除。

## 5. AI 洞察板块

> 2026-09-01 用户裁决：提供 AI 对用户的分析、剖析与建议的专门板块。

记忆中心内的「洞察」tab，是基于全部记忆的 AI 聚合视图，与条目管理
（§2）、推荐处理（§4）并列：

- **画像摘要**：工作重心、偏好、协作习惯等分段呈现，每段标注支撑该结论
  的来源记忆条目（可点击跳转 L2 详情）。
- **近期趋势**：最近记忆变化反映出的方向，数据源为 §3 时间线。
- **建议清单**：与 §4 推荐卡片同源，聚合呈现待处理项。
- **缺口提示**：值得让 agent 记住但尚无记忆覆盖的方向，仅作提示，
  不自动写入。

属性与边界：

- 洞察内容是 **AI 生成的派生视图**，可再生、可清空；界面明确标注
  「AI 分析，非记忆本体」。
- **永不注入 prompt / system 段**（见 §9 红线）：洞察只给用户看，不改变
  任何会话行为。
- 生成走 Haiku 级 one-shot（全量语料、结果缓存）；手动刷新 + 记忆发生
  显著变化时提示可刷新。刷新消耗 API 额度，需在界面上如实呈现。

## 6. 管理与维护产品化

- **回收站**：删除先进回收站（store 目录内 tombstone 区 + 恢复入口），
  替代当前直接 unlink；回收站条目可恢复、可彻底清除。
- **重置前快照**：执行「重置所有记忆」前自动把当前分片打包为带时间戳的
  快照（保留最近 N 份，本地 only），把「不可撤销」升级为「可后悔一次」。
  帮助文档同步更新。
- **体检（review 卡片化）**：把已有的 `memory_review`（Claude Haiku one-shot）
  从 agent 工具升级为界面动作：点「体检」→ 建议以卡片呈现（保留 / 修改 /
  忽略），用户采纳的动作走 store 写路径并记入事件日志；体检结论本身落库，
  不再是一次性输出。
- **合并预览（consolidate dry-run）**：执行 `memory_consolidate` 前先展示
  「将合并哪些分片、前后体积」，确认后才执行并记入事件日志。
- 开关、重置、恢复默认等既有能力保持现状，全部收进记忆中心头部。

## 7. 工程架构要点

- **单写路径**：UI 的所有增删改都走 `MakerMemoryManager` → `store.write/delete`
  现有入口（与 MCP 工具、flush controller 同源），保证 agent 写入与用户编辑
  共享同一套校验、索引同步与事件记录，不允许 renderer 绕过直写文件。
- **新增 IPC 通道**（`apps/desktop/src/main/maker-ipc/channels.ts`，main 侧在
  maker-host 内实现）：entries list / entry read / entry write / entry delete
  (soft) / restore / trash list / history / search / prompt preview /
  recommendations list·decide / insights get·refresh / consolidate preview /
  reset snapshot export。Renderer 不接触文件路径。
- **新增存储**：per-workdir SQLite 新增 `memory_recommendations` 与
  `memory_insights` 表（均为派生数据，可重建，永不上传）。
- **prompt 语义零改动**：读取是纯旁路；`MEMORY.md`「会话启动时快照、rewind
  不刷新」语义不变；编辑只影响新会话（toast 沿用「新会话生效」口径）。
  不改 `makerMemoryRules` 等任何 system prompt 段（该改动有独立 owner 门禁）。
- **缓存率红线**：不触碰 prompt 组装路径与拼接顺序；注入预览读取的是
  `getIndex()` 同源数据，只读展示。
- **UI 交付基线**：Light / Dark 双模式必须同实现，颜色走语义 token；文案
  落地前过 `i18n/GLOSSARY.md` 与 `pnpm check:i18n-glossary`；涉及「任务」
  一词的文案遵循 task-and-conversation-naming。

## 8. 归属判定：Core（已裁决）

> 2026-09-01 用户裁决：记忆是核心能力，不进入插件范畴。以下检查保留
> 作为决策记录：

按 `core-product-principles.md` §6 / §8 逐条回答：

1. **帮用户完成什么**：看懂并修正 agent 对自己的长期认知；错误的记忆不
   再需要靠「全部清空」处理。
2. **门槛**：零新增配置；默认路径直达（设置里已有记忆分区）。
3. **通用连接 vs 组织流程**：通用——记忆是宿主持有的用户数据，与具体
   组织无关。
4. **为何 Core**：必须触碰 maker-core 记忆存储与 userData 生命周期（owner
   作用域、fail-closed 语义），插件沙箱无法也不应持有该数据面；它是稳定
   基础原语而非垂直入口。
5. **富交互为何不做成插件**：插件适合第三方在上面做记忆的「用法」（如
   记忆驱动的工作流），「记忆本体管理」是宿主数据控制面。
6. **多端连续**：见 §11。
7. **可控性**：每步可看（三层视图）、可停（体检 / 合并均为显式动作）、
   可撤销（回收站 + 重置快照）。

## 9. 红线与不变量

- 不修改 system prompt / `makerMemoryRules` / prompt 拼接顺序（owner 门禁）。
- 不破坏 `MEMORY.md` 会话启动快照语义与缓存前缀稳定性。
- 文件 source of truth 不变；事件表、回收站均为派生或可恢复结构。
- 记忆内容与事件日志只落本地，不进日志上报、不进遥测。
- `digest` 不升级为可写类型、不进索引；Hub 只读展示并标注。
- AI 推荐永不静默执行：所有写动作逐条经用户确认后走单写路径；洞察
  内容永不注入 prompt 或 system 段。
- 存量数据零迁移：事件表空启动即可，无历史的老分片正常展示（时间线
  从安装本功能起算），不要求用户做任何操作。

## 10. 分期与验收

| 期 | 内容 | 验收 |
|---|---|---|
| P1 只读可见 | L1 概览 + L2 详情 + 搜索 + L3 注入预览；全部只读 IPC | 能看到每个 workdir 的全部条目；预览与真实注入索引一致；双模式目检 |
| P2 编辑与历史 | 正文 / 元数据编辑、回收站、事件日志 + diff 视图 | agent 与用户的写入都出现在时间线；删除可恢复；快照语义不变 |
| P3 AI 分析与推荐（手动） | 推荐卡片（更新 / 重叠 / 废弃 / 错放）+ 洞察 tab + 重置快照 + 合并预览 | 推荐逐条采纳并落事件日志；洞察不注入 prompt；重置可回滚；合并前有预览 |
| P4 后台主动分析 | delta 触发的后台分析（空闲时、频率上限、设置开关） | 达到条件自动产出推荐；成本与频率符合上限；可一键关闭 |
| P5（可选） | Mobile / 远程只读记忆摘要与洞察只读 | 见 §11 |

每期提交前按仓库门禁跑 `pnpm test:unit:related` 与涉及 package 的
typecheck；P2 起为 store 事件记录补定向单测（写入、删除、恢复、rebuild）。

## 11. 多端口径

- Desktop 是记忆的编辑面（workdir 绑定本地文件系统）。
- Mobile / 远程连接不复制编辑界面；P5 只提供当前 workdir 的只读摘要
  与洞察只读（L1 子集），编辑与刷新请求回落到桌面端处理，符合「每端
  承担适合它的职责」。

## 12. 非目标

- 不做记忆的云同步或多机合并（存储明确 local-only，换机不迁移是既有
  产品语义）。
- 不做跨 agent 记忆编辑器（Claude / Codex 原生记忆仍由各自体系管理，
  记忆中心只管 Cindy 共享记忆）。
- 不自动执行任何记忆变更；LLM 只产出分析与推荐，所有写动作显式经用户
  确认。后台分析（P4）仅产出推荐对象，不直接修改记忆。

## 13. 待决策事项

1. 命名：界面名称候选「记忆中心」/「记忆管理」；洞察 tab 候选「洞察」/
   「AI 分析」，以术语表裁决为准。
2. 重置快照保留份数（建议 3）与保留时长。
3. 事件日志保留上限（建议 500 条或 2MB，先到为准）。
4. 推荐是否支持批量采纳（涉及批量写入，建议首期只支持逐条）。
5. P4 后台主动分析默认开 / 关与上限（建议：默认开 + 严格上限——Haiku 级、
   每 workdir 每周至多 1 次、delta ≥ 5 条、仅空闲时；设置可一键关）。
6. 洞察刷新消耗 API 额度，按钮旁的成本口径如何呈现。
7. 推荐对象的过期策略（建议 90 天未处理转 `expired`，分析时复核）。
8. 「缺口提示」是否纳入 P3（生成成本 vs 价值）。
9. P1 是否顺带展示 per-agent 原生记忆（Claude / Codex）的存在状态（建议
   首期不展示，避免与共享记忆混淆）。
