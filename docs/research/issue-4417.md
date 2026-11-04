# Issue #4417 研究记录

核查日期：2026-09-14（对照 upstream/main `81643467c`）

## 候选

[Issue #4417：手工导入的模型缺少窗口、视觉和推理配置](https://github.com/makecindy/cindy/issues/4417)

统一模型设置里补不上 `contextWindow` / `supportsImageInput` / `reasoning`：只返回 ID 的自动发现模型、以及用户手工添加的模型只落 `id` / `name`，于是永久卡在默认 200K，也打不开视觉与推理。创建于 2026-09-13 16:46，`state: open`、无 assignee、无 label。

## 为什么在最新的里选它

按创建时间倒序过了一遍当前全部 open issue（2026-09-14 采集）：

- **#4429（09-14 03:07，最新的一条）已经等于修好了**：#4273 的同类问题由 PR #4275（commit `a8286bda4`，2026-09-11 10:43）修复，该 commit 已在 main 上；报告的 0.1.79 指向 09-10 17:03 的提交，只是还没拿到这个修复。不是可做的候选。
- **#4425（09-13 18:54）** VS Code 扩展版 Cindy，大型功能请求，超出本仓可交付范围。
- **#4420（09-13 17:27）** Bedrock 走本机 AWS 凭证：只有「不伪造 API Key 也能保存」这一半能在 macOS 上验证，完整修复（宿主 AWS 凭证 + 可用性检查）需要真实 Bedrock 环境。
- **#4419（09-13 17:15）** 已有开放 PR #4424。
- **#4416（09-13 16:05）** Google/Vertex 代理：阻塞在 Pi / `@google/genai` 是否接受 `outboundFetch`，属上游依赖。
- **#4403（09-13 09:04）** 两份报告都来自 Windows（0.1.60 / 0.1.79），本机没有 Windows，无法核验。

再往前的 open issue 要么已有开放 PR，要么依赖 Windows 实机、鸿蒙、Linux 打包、AWS、局域网多设备等本机不具备的环境。

## 无人在做的证据

- Issue 的 Development 栏为空：GraphQL `closedByPullRequestsReferences` 返回 `[]`，timeline 的 `CrossReferencedEvent` 里没有任何 PullRequest。
- GitHub 搜索 `repo:makecindy/cindy is:pr 4417` 唯一命中是父 PR #4402（已 merged），不是处理本条的 PR。
- 抓取的 193 条开放 PR 标题与正文里，`#4417` 出现 0 次。

## 尚未修复的代码证据

`apps/desktop/src/renderer/components/settings/ModelAdvancedDrawer.tsx` 的「规格」和「能力」两节都是只读展示：`contextWindow` 行只读 catalog 值，缺配置时显示 `catalogMissing`；`imageInput` 行走 `CapabilityValue` 展示，来源写 `catalogCapabilities` / `visionSource`；`reasoning` 在该文件里没有任何行。可编辑的只有「任务工作上限」那条，正是 issue 说的「上下文项写的是任务工作上限」。`ProviderConnectionDialog.tsx` 在 #4402 之后只改连接、不再承担能力编辑，所以这些能力字段目前没有编辑入口。

## 验证方式

不依赖 Windows、鸿蒙、AWS 或专用硬件：本机是 macOS 桌面端，设置页可直接打开。已有 `apps/desktop/src/renderer/components/settings/__tests__/ModelAdvancedDrawer.test.tsx`，配置读写链路可以先用 Vitest 立回归，再在设置页人工确认（改完窗口值后检查新任务实际拿到的上限）。

## 风险

这是维护者从已合并 PR #4402 拆出的后续项，可能已被排进内部计划；动手前建议先在 issue 里认领一句，避免撞车。

