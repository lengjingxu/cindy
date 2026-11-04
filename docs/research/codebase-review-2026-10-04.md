# Cindy 全仓代码审查：死代码、逻辑一致性与补丁累积

审查日期：2026-10-04  
固定基线：`3223fd29cc11a38a0eeaae2c9c77ea66eda22518`  
范围：本客户端仓的 Desktop、Mobile、共享 packages 和工程脚本。服务端不在范围内。

## 结论

**存在可确认的死代码和逻辑不一致，也存在旧实现撤下后，辅助函数、测试及注释没有一起清理的情况。** 本轮最有价值的发现是：

1. Renderer 的部分队列 reducer 和 Review 辅助函数已没有生产调用，单测仍在验证这些旧路径。
2. 资源用量窗口、右侧栏窗口和插件面板窗口拥有近似的就绪／超时流程，但对“壳未挂载时能否展示”的处理不同；后两者可以展示尚未就绪的窗口。
3. Mobile 的部分界面绕过 i18n，直接展示共享层生成的中文文案。
4. Orca 保留了一份生产中永远不会进入 pending 的旧诊断状态；另一个捕获注册表缺少回收入口，文本上限也没有覆盖所有事件分支。

这些证据支持分批清理存量，不能据此断言所有兼容逻辑都应该删除。协议转换方向、旧版客户端 wire 通道、账号数据迁移、异步分代隔离均有实际用途。本轮没有确认 P0，也没有完成可利用性安全审计。

## 1. 方法、基线和覆盖边界

开始时工作区位于 `feat/local-theme-wallpaper`，有主题相关未提交修改、178 个 generated vendor 文件删除，以及未跟踪文件。这些改动不属于本次审查，未纳入缺陷结论，也未覆盖或回退。文中行号均对应上述固定提交。

本轮做了全仓清单和文本扫描，再对风险集中的调用链人工复核。**全仓扫描不等于逐行审完全部源码。** 没有启动 Desktop/Mobile，没有做实机故障注入、堆快照、网络联调或全部单测。

扫描口径：Git 跟踪的 JS/TS 文件，涵盖 `apps/desktop/src`、`apps/mobile`、`packages`、`scripts`；排除 `vendor`、`_generated`、`dist`、原生 `ios/android` 路径、`.min.*`、`.generated.*`、`.d.ts`。生产行数排除 `__tests__`、`__fixtures__`、`.test.*`、`.spec.*`，保留注释和空行。

| 区域 | 扫描文件数，含测试 | 测试／fixture 文件数 | 非测试源码行数 |
| --- | ---: | ---: | ---: |
| Desktop | 4,827 | 2,164 | 843,255 |
| Mobile | 758 | 313 | 133,644 |
| maker-core | 240 | 113 | 71,387 |
| maker-shared | 122 | 59 | 20,992 |
| 工程 scripts | 82 | 26 | 17,057 |

按同一口径，所有扫描区域合计非测试源码 **1,221,869 行**。这不是业务有效代码量，也不是人工阅读量。

人工核对重点：

| 区域 | 实际检查内容 | 覆盖限制 |
| --- | --- | --- |
| Desktop Renderer | 路由、导出与调用关系、队列旧 reducer、Review helper、状态存储热点 | 未逐行审查所有 UI、样式、每种竞态 |
| Desktop Main / preload / shared | 三类辅助窗口的 ready／超时、会话副窗加载与导航、相关 IPC、插件与 MCP 接线 | 未审完每个 IPC sender／payload 校验 |
| maker-core 与运行时 | Agent 入口、CC/Pi manager、模型目录与 effort、协议桥挂载、scheduler、Orca | 未跑真实模型、多进程或 SSH 故障测试 |
| Mobile 与共享层 | auth、Device Link 恢复／超时、共享展示模型、i18n 消费链 | 未逐行审完 Mobile，未检查原生 Swift/Kotlin 实现 |
| 工程脚本 | workspace 单测清单覆盖、i18n 校验范围、静态统计 | 未做所有发布矩阵和打包复现 |
| 其他共享包 | 文件清单、导出和引用扫描 | fs/媒体/数据库/更新器/原生二进制未做专项审计 |

发现使用三种结论强度：**确认**表示源码和引用关系已闭环；**维护债**表示有确定冗余或检查缺口，但未证明运行故障；**待验证**表示还需要运行时或产品边界证据。清理项不作为仓库 PR review 的 P2 风格建议上报；它们属于本次用户明确要求的存量分析。

## 2. 已确认的问题与维护债

### F01：辅助窗口的超时展示条件发生分叉

**性质：确认的行为不一致；按现行 §3.1 就绪要求，建议优先处理。**

- [资源用量窗口 controller](../../apps/desktop/src/main/resource-usage-window/controller.ts)，第 211–225 行：超时后先检查 `rendererReady`，壳未就绪就使该窗口失效；只有壳已就绪、内容未就绪时才展示。
- [右侧栏窗口 controller](../../apps/desktop/src/main/right-sidebar-window/controller.ts)，第 619–632 行：壳未就绪只记 warning，随后仍调用 `showWindow`。注释以“5s 足够”代替实际就绪条件。
- [插件面板 controller](../../apps/desktop/src/main/ghost-panel-window/controller.ts)，第 431–438 行：超时只检查窗口存活和 `pendingOpen`，直接 `showAndFocus`。`rendererReady` 在第 199、324、467 行被写入／重置，没有进入展示判断。

**触发条件：** 冷启动或 reload 后，5 秒内壳挂载／ready IPC 没有完成，且用户仍在等待打开。由源码可确定窗口会被要求显示；是否出现空白及持续多久，尚未实机复现。

**影响：** 同一种超时在三处有不同结果，后两处无法保证展示的是已挂载 Loading 壳。与 [Electron 规则 §3.1](../dev-rules/electron-security-and-process-boundaries.md)“超时只能展示已经挂载的 Loading 壳”的要求不一致。

**建议：** 沿用资源用量窗口的就绪判定与有界失效恢复，收敛三处共有条件；先补“两个 ready 都没到”和“仅 shell ready 已到”的定向验证。不要再添加一个固定等待时长来补这个分支。

### F02：Mobile 的部分共享展示结果固定为中文

**性质：确认的用户可见不一致；既有已登记问题。**

- [sessionSelection.ts](../../packages/maker-shared/src/sessionSelection.ts)，第 67–76、122–128 行：批量操作摘要直接生成中文 `title`、`description`、`confirmText`。
- [sessionList.ts](../../packages/maker-shared/src/sessionList.ts)：`remoteSessionListTitle`、`deviceSessionEmptyState` 返回中文。
- [scheduleModel.ts](../../packages/maker-shared/src/scheduleModel.ts)，第 186–220、242–260 行：运行状态摘要和动作 label 使用中文。
- 消费方：[设备详情页](../../apps/mobile/app/devices/[deviceId].tsx) 第 316、331–337、355 行及对应 JSX；[自动化页](../../apps/mobile/app/automations/[deviceId].tsx) 第 2035–2061 行直接展示 `summary.title`、`summary.meta`、`summary.detail` 和动作文案。

**触发条件：** Mobile 切换到英文、日文、韩文等语言，再打开这些摘要或批量操作确认入口。

**影响：** 页面自己的字段经过 `t()`，共享模型返回的文案原样展示，形成混排。[命名规则 §8](../product-rules/task-and-conversation-naming.md) 已登记这笔债务，当前基线仍未消除。

**建议：** 共享模型返回状态、计数及参数，由页面已有 i18n 完成展示；或传入明确的 strings 参数。用一个非中文语言验证整条消费链，不要只替换中文措辞。

### F03：三个完整的 Renderer 模块已没有消费方

**性质：确认的仓内死代码；可优先清理。**

| 文件 | 证据 | 清理边界 |
| --- | --- | --- |
| [WelcomePage.tsx](../../apps/desktop/src/renderer/components/welcome/WelcomePage.tsx):6 | `WelcomePage` 仅在定义处出现；[router.tsx](../../apps/desktop/src/renderer/router.tsx) 的首页进入 `CCAgentIndexRedirect` | 可删除旧组件；品牌 hook 和翻译 key 要独立查引用，不能连带删 |
| [effortMapping.ts](https://github.com/lengjingxu/cindy/blob/3223fd29cc11a38a0eeaae2c9c77ea66eda22518/apps/desktop/src/renderer/lib/effortMapping.ts):23–34 | `EFFORT_TO_BUDGET_TOKENS` 只被同文件函数读取，`effortToSdkExtendedThinking` 无外部引用；文件头明确写“本轮无消费方”及待确认 SDK 形态 | 删除这个预置实现；不触碰 maker-core 的真实 effort 处理 |
| [scheduleGrouping.ts](../../apps/desktop/src/renderer/features/cc-agent/lib/scheduleGrouping.ts):45 | 文件名和 `groupSchedules` 均没有外部生产或测试引用 | 不连带删除仍被使用的 `projectGrouping` / `scheduledSessionGrouping` |

查了文件名、导出标识符、路由及 Renderer 的动态批量加载入口，没有发现这些文件通过配置自动注册。这里的“死”指当前仓内运行链不可达，不推算 bundle 节省量。

### F04：队列生产实现迁移后，旧 reducer 和单测仍留在 Renderer

**性质：确认的局部死代码及测试维护债。**

[makerQueueState.ts](../../apps/desktop/src/renderer/lib/makerQueueState.ts) 中，多项旧状态写操作没有生产调用，例如：

- `getDrainableQueueHead`（155）、`markDispatchStarted`（172）、`rollbackPreAcceptSendFailure`（194）；
- `setQueueExpandedState`（218）、`resumeQueueState`（222）、`setQueueInteractionLockState`（226）、`setQueueEditLockState`（243）；
- `stopQueueState`（507）。

[makerChatStore.ts](../../apps/desktop/src/renderer/lib/makerChatStore.ts) 第 327–334 行只从该模块导入六个仍使用的辅助函数；第 11343–11422 行的实际展开、恢复和移动队列操作已调用 `input.setExpanded`、`input.resume`、`input.move`，由主进程 projection 回流。

与此同时，[makerQueueState.test.ts](../../apps/desktop/src/renderer/__tests__/makerQueueState.test.ts) 仍直接测试一部分旧 reducer。`makerChatStore.ts:5378` 的注释还宣称 `activeTurnRetryText` 由已无生产调用的 `markDispatchStarted` 写入。

**影响：** 修改旧 reducer 可以得到测试反馈，却不改变当前队列执行；读代码时仍像是 Renderer 拥有队列派发真相。不能据此说主进程缺测试，本轮没有得出那个结论。

**建议：** 按函数删除无生产调用的状态写操作，保留六个活跃 helper；核对旧测试中仍有价值的行为断言是否已覆盖到实际 input coordinator 链路，缺失的才迁移。不要删除整个文件或批量删队列测试。

### F05：Review 页面保留了只被 helper 单测调用的旧函数

**性质：确认的局部死代码；测试与生产调用脱节。**

[ReviewTabBody.tsx](../../apps/desktop/src/renderer/features/right-sidebar/plugins/review/ReviewTabBody.tsx) 中，以下导出无生产调用：

- `refreshBranchDiffAfterCommit`（211）；
- `getLastTurnCappedSummaryEntries`（296）、`buildLastTurnCappedData`（312）、`getCappedDiffForSource`（319）；
- `lastTurnStageableTargets`（2856）、`lastTurnDiscardableDiffs`（2861）。

这些函数仍由 [ReviewTabBody.helpers.test.ts](../../apps/desktop/src/renderer/features/right-sidebar/plugins/review/__tests__/ReviewTabBody.helpers.test.ts) 导入并断言。例如测试验证 `refreshBranchDiffAfterCommit('branch', refresh)`，并不能证明真实提交按钮完成后调用了它。

**建议：** 逐项清理无生产用途的 helper，沿真实提交／diff 查询调用核对行为测试。这里只确认旧 helper 没有消费者，没有据此认定当前页面刷新或 capped diff 功能损坏。

### F06：Orca 的旧 auto-bridge pending 状态在生产中恒为空

**性质：确认的死诊断逻辑；未发现用户可见派发故障。**

[orca-bridge-mcp.ts](../../packages/orca-workflow/src/orca-bridge-mcp.ts)：

- 第 461–489 行维护 `workerAutoBridgePending`，只有传 `true` 才创建状态。
- 生产调用在第 791 行传入 `false`，只删除条目。
- 唯一的 `true` 调用来自 [orca-bridge-mcp.test.ts](../../packages/orca-workflow/src/__tests__/orca-bridge-mcp.test.ts):360，经 `__testing` 注入。
- 第 815–818 行读取结果作为失败日志元数据；它不控制派发、接收或去重。
- 实际 host pending 状态由 [orcaTeamService.ts](../../apps/desktop/src/main/maker-ipc/orcaTeamService.ts):305、355–371 的另一份 map 管理。

**影响：** 日志中的这一份 `autoBridgePending` 在生产中恒为 false，注释声称保留的旧状态没有生产写入方；测试能造出生产不会出现的状态。

**建议：** 删除旧 map／写入口，以及测试中仅为这份旧状态服务的注入和断言；确需日志观察时从当前 host 状态取值。`orca-bridge-mcp.test.ts:295–379` 的主体还验证 caller attestation 和伪造 worker id 的拒绝，必须保留这些安全回归断言，不能整项删除。不要为保住旧实现重新添加第二份状态写入。

### F07：Orca 捕获注册表没有回收，文本截断只覆盖增量事件

**性质：确认的资源生命周期与分支不一致；实际内存影响待测。**

[orca-bridge-mcp.ts](../../packages/orca-workflow/src/orca-bridge-mcp.ts)：

- `CapturedSessionRegistry`（96–106）只提供 `get/add`，没有删除／容量限制。
- `leadCaptures` 在 provider 创建时构造（704–706）；[maker-host/index.ts](../../apps/desktop/src/main/maker-host/index.ts):715 起的 `getMaker()` 缓存 Maker，provider 在该初始化路径第 909 行创建。
- `ensureCapturedSession`（667–696）给每个访问过的 lead 加条目；重新访问已关闭／出错的实例时才释放旧订阅并换引用。
- `captureSessionOutput`（422–438）只对增量 `text` 执行 `.slice(-MAX_CAPTURED_TEXT)`；`isFinal === true` 的 text 和 `done.result` 直接赋值，不受这个限制。

这不是仅由测试构造的事件形态：[Codex translator](../../packages/maker-core/src/agents/codex/translator.ts):1148 和 [Pi translator](../../packages/maker-core/src/agents/pi/translator.ts):450 都会生成 `isFinal: true` 的完整文本。[Session](../../packages/maker-core/src/session.ts):1030–1053 关闭时清空 listener set，也不会自动删除 Orca entry 对 Session／disposer 的引用；其 `onEvent` disposer（1516–1519）本身还捕获 Session。

`MAX_CAPTURED_TEXT = 64 * 1024` 被传给字符串 `slice`，这里按 UTF-16 code unit 计数，不能写成“最多 64 KiB 内存”。最终事件还能绕过该截断，所以连这个长度上限也不是所有路径都成立。

**影响：** 长期运行并访问更多 lead 后，provider 可继续保留旧条目、文本和引用。最终内容上限与增量路径不同。没有堆快照，不能把增长速度、泄漏字节数或 OOM 当成已证实结果。

**建议：** 先明确桥接历史查询需要保留多久、最终文本是否必须完整，再确定统一上限和回收时点；验证关闭、归档、重新 hydrate 后的历史查询语义。不能直接截断最终结果而忽略产品契约。

### F08：Mobile locale 的 key 对齐没有进入现有 i18n 门禁

**性质：确认的工程覆盖缺口；当前未发现 key 缺失。**

[scripts/check-i18n.mjs](../../scripts/check-i18n.mjs):5–6、26–27 只读取 Desktop locale。Mobile 的 JSON key 对齐不由 `pnpm check:i18n` 保证，这一限制也已在命名规则 §8 登记。

本轮额外对 Mobile 五种语言的 JSON 做了只读 key 集合比较，将 `_zero/_one/_two/_few/_many/_other` 归并成 plural 家族：每种语言均为 **1,290 个归一化 key，集合差异 0**。这项检查不等于完整的 plural 类别、插值变量和翻译语义校验。

另外，`check:i18n-glossary` 对 Mobile JSON 有术语覆盖，不能写成“Mobile 完全没有 i18n 检查”。缺的是这里讨论的 locale key／schema 对齐门禁。

**建议：** 扩展现有校验入口纳入 Mobile，以真实 locale 资源入口为准；保持与当前复数规则一致，避免另建第三套检查语义。

## 3. 需要进一步验证的风险

### R01：顶层导航守卫仅限制 HTTP(S)

[secondary-windows.ts](../../apps/desktop/src/main/secondary-windows.ts):58–80 的 `will-navigate` 仅阻止外部 HTTP(S)，`file:`／其他 scheme 没有被该 handler 阻止；URL 解析异常时也直接放行。`setWindowOpenHandler` 默认 deny 不能替代顶层导航限制。Ghost 与右侧栏窗口复用这个 helper。

[bootstrap-electron.ts](../../apps/desktop/src/main/bootstrap-electron.ts):3172–3187 的主窗也采用相近逻辑，且直接 `new URL(url)`。因此这里既有守卫边界问题，也存在主窗／副窗复制实现的漂移风险。

已确认这些分支的代码行为，但本轮未证明用户内容能触发特权窗口导航，未验证 Electron 对每个 scheme 的实际处理，也未完成 CSP、preload 和页面入口的联动分析。**不把它写成已复现安全漏洞。** 应作为专项审查项：确认受信主文档 URL 的允许集合，再验证其他目标被拒绝及旧 deep link 行为。正式包本身通过 `file://` 加载主文档，不能直接封禁整个 file scheme。

### R02：会话副窗的显示与失败收口缺少业务就绪证据

[secondary-windows.ts](../../apps/desktop/src/main/secondary-windows.ts):159–175 在 `did-finish-load` 或 `ready-to-show` 时显示；注释明确说后续路由／数据库工作仍在继续。第 186–201 行的 `loadURL/loadFile` Promise 没有本地 catch，当前函数也未安装加载失败回收。

这是确定的实现差异，但该窗口是完整任务窗口，与工具辅助窗口有功能差别。需实机确认慢加载时是否已有可辨识壳、加载失败时全局 handler 如何处理，以及窗口是否保留。没有验证前，不断言必然白屏、崩溃或泄漏，也不直接套用“所有关闭都必须 hide”的辅助窗口规则。

## 4. 补丁累积主要集中在哪里

单纯出现 `fallback`、`catch` 或 `setTimeout` 不能证明补丁有害。按前述非测试源码口径，文本扫描得到 `fallback` 2,597 次、`setTimeout(` 903 次；其中包括注释、合法降级和超时控制，不是缺陷数量。

更有解释力的证据是：**同一种状态被多处维护、旧写路径撤走但测试未撤、相同生命周期判断在副本间发生分叉。** F01、F04、F05、F06 分别给出了这些情况的具体实例。

| 热点文件 | 基线行数 | 后续应如何审查／收敛 |
| --- | ---: | --- |
| `renderer/lib/makerChatStore.ts` | 15,705 | 按“输入被接收→projection 回流→历史落库→断连恢复”查状态所有者；先删旧 reducer，再决定是否拆文件 |
| `main/maker-ipc/register.ts` | 14,964 | 按同一业务资源的 handler 审查 sender、scope、错误协议；文件长度本身不构成 bug |
| `maker-core/src/agents/codex/index.ts` | 12,001 | 按协议版本和事件生命周期验证兼容分支是否仍可达；保留真实支持矩阵 |
| `mobile/app/sessions/[sessionId].tsx` | 11,035 | 沿状态读取、动作派发、恢复和展示链审查；优先复用已有共享契约 |
| `renderer/components/new-chat/ChatInput.tsx` | 9,086 | 检查编辑草稿、排队、语音、引用和发送的所有权交接 |
| `main/bootstrap-electron.ts` | 7,917 | 收敛已经发生行为分叉的窗口／导航接线，避免按行数机械拆文件 |

不建议一轮做全仓重构，或把所有防御分支封装成新的通用框架。先移除确定失效的路径，再对仍活跃的重复逻辑做小范围收敛。

## 5. 已排除的假阳性

| 候选 | 排除原因 |
| --- | --- |
| 多个 Responses / Anthropic / Chat bridge | 转换方向和上游协议不同，host 有实际选择和挂载；不是同一功能的新旧死副本 |
| Device Link 旧语音转写通道 | allowlist 与 Desktop handler 为旧客户端保留 wire 面，删除会破坏兼容 |
| 账号 realm 的 V1/V2 记录、旧配置解析 | AuthContext / 迁移仍有消费；字段名旧不等于不可达 |
| Device Link epoch、拥塞冷却、presence 恢复 | 有明确并发与重连边界，不能仅因状态多归为补丁债 |
| 模型报价 hook、PlanChangeDialog、跨 Agent 转换弹窗 | 文件名与导出名不同，按文件名粗搜容易误判；真实消费方存在 |
| Ghost gateway 与 MCP provider 接线 | `cindy-tools` / `lizi-mcps` 活跃入口有宿主调用；退役模块已有显式处理 |
| workspace 单测清单漏包 | 实际 33 个 workspace 都在清单中；runner 另有双向清单覆盖检查 |
| 测试 reset helper / 纯测试入口 | 仅测试调用是明确用途，不自动当成死业务代码 |
| 历史 migration、generated vendor、分发二进制 | 不能靠 import 引用判断是否可删除，本轮未提出删除建议 |

## 6. 建议的处理顺序与验收

| 批次 | 范围 | 完成标准 |
| --- | --- | --- |
| 1 | F01 窗口就绪分叉；R01 导航边界专项验证 | 验证 shell 未就绪／仅 shell 就绪／内容就绪／崩溃恢复；导航风险有可执行复现或明确排除证据 |
| 2 | F03–F06 可证实的死路径 | 一次只清理一个模块；活跃消费者保留；测试落在真实调用链；移除失效注释 |
| 3 | F02 共享中文、F08 Mobile key 门禁 | 非中文界面完整验证；Desktop 和 Mobile 的资源差异都能被原有检查入口发现 |
| 4 | F07 捕获生命周期、R02 副窗失败 | 明确保留契约；测多 lead／超长最终输出／归档与重建；区分预期缓存和无回收引用 |
| 5 | 大文件中的活跃重复状态 | 仅针对前四批暴露的共同职责收敛，避免为行数或形式统一引入新抽象 |

后续若实施修复，应按仓库规则读取对应专项文档，运行根 `pnpm test:unit:related` 和受影响 package 的 typecheck，再提交。本文不授权删除用户数据、历史 migration 或 wire 兼容通道，也没有实施这些代码修改。

## 7. 验证记录与复查方法

已完成：固定 Git 基线；全仓跟踪源码统计；导出、路由和消费者反查；9 个代表性死导出在非测试代码中均只有定义处命中；以上发现的源码交叉复核；Mobile 五语言 key 集合比较；33 个 workspace 与测试清单的覆盖核对；文档本地链接和格式检查。

未完成：运行期复现、全量测试、包 typecheck、实机 Light/Dark 目检、内存测量和安全可利用性验证。当前 checkout 的依赖解析检查无法找到 `typescript`（`MODULE_NOT_FOUND`），未安装或变更依赖来完成本次静态审查。任何运行影响的推断均在条目中注明。

下面的命令均固定在审查提交，可在未来代码变化后回查当时的依据：

```bash
AUDIT_BASE=3223fd29cc11a38a0eeaae2c9c77ea66eda22518

# 三个完整死模块：核对文件名、标识符及调用位置
git grep -n -E 'WelcomePage|effortMapping|effortToSdkExtendedThinking|EFFORT_TO_BUDGET_TOKENS|scheduleGrouping|groupSchedules' "$AUDIT_BASE" -- apps packages scripts

# 队列旧写操作：观察生产定义与测试消费者
git grep -n -E 'getDrainableQueueHead|markDispatchStarted|rollbackPreAcceptSendFailure|setQueueExpandedState|resumeQueueState|stopQueueState' "$AUDIT_BASE" -- apps/desktop/src

# Review helper 的实际消费者
git grep -n -E 'refreshBranchDiffAfterCommit|buildLastTurnCappedData|getCappedDiffForSource|lastTurnStageableTargets|lastTurnDiscardableDiffs' "$AUDIT_BASE" -- apps/desktop/src

# Orca pending 写入方，以及文本捕获和注册表回收边界
git grep -n -E 'setAutoBridgePending|workerAutoBridgePending|leadCaptures|MAX_CAPTURED_TEXT' "$AUDIT_BASE" -- packages/orca-workflow apps/desktop/src/main/maker-ipc/orcaTeamService.ts
git show "$AUDIT_BASE:packages/orca-workflow/src/orca-bridge-mcp.ts" | nl -ba | sed -n '422,440p;667,707p'

# 三类窗口的超时分支
git show "$AUDIT_BASE:apps/desktop/src/main/resource-usage-window/controller.ts" | nl -ba | sed -n '211,225p'
git show "$AUDIT_BASE:apps/desktop/src/main/right-sidebar-window/controller.ts" | nl -ba | sed -n '619,632p'
git show "$AUDIT_BASE:apps/desktop/src/main/ghost-panel-window/controller.ts" | nl -ba | sed -n '431,438p'

# i18n 门禁的实际输入路径
git show "$AUDIT_BASE:scripts/check-i18n.mjs" | nl -ba | sed -n '1,30p'
```

这些搜索用于复核列出的证据，不是通用死代码分析器。删除决策仍需核对动态注册、包公共 API、兼容契约和真实用户行为。
